// Cyber Bible - 数据操作层
(function() {
  const db = window.CyberBible.db;

  // ========== 提示词操作 ==========

  function createPrompt(data) {
    const now = Date.now();
    const prompt = {
      id: crypto.randomUUID(),
      title: data.title || '无标题',
      content: data.content || '',
      groupId: data.groupId || null,
      tags: data.tags || [],
      created: now,
      updated: now
    };
    return db.add('prompts', prompt);
  }

  function updatePrompt(id, updates) {
    return db.get('prompts', id).then(function(prompt) {
      if (!prompt) throw new Error('提示词不存在: ' + id);
      const updated = Object.assign({}, prompt, updates, { updated: Date.now() });
      return db.update('prompts', updated);
    });
  }

  function deletePrompt(id) {
    return db.delete('prompts', id).then(function() {
      // 删除关联的批注
      return db.getByIndex('annotations', 'by_promptId', id);
    }).then(function(annotations) {
      const promises = annotations.map(function(a) {
        return db.delete('annotations', a.id);
      });
      return Promise.all(promises);
    });
  }

  function getPrompt(id) {
    return db.get('prompts', id);
  }

  function getAllPrompts() {
    return db.getAll('prompts');
  }

  // ========== 分组操作 ==========

  function createGroup(data) {
    const group = {
      id: crypto.randomUUID(),
      name: data.name || '未命名分组',
      color: data.color || '#4A90D9',
      order: data.order || Date.now()
    };
    return db.add('groups', group);
  }

  function updateGroup(id, updates) {
    return db.get('groups', id).then(function(group) {
      if (!group) throw new Error('分组不存在: ' + id);
      return db.update('groups', Object.assign({}, group, updates));
    });
  }

  function deleteGroup(id, moveToGroupId) {
    // 先移动该分组下的提示词
    return db.getByIndex('prompts', 'by_groupId', id).then(function(prompts) {
      const promises = prompts.map(function(p) {
        return db.update('prompts', Object.assign({}, p, { groupId: moveToGroupId || null, updated: Date.now() }));
      });
      return Promise.all(promises);
    }).then(function() {
      // 删除分组
      return db.delete('groups', id);
    });
  }

  function getAllGroups() {
    return db.getAll('groups').then(function(groups) {
      return groups.sort(function(a, b) { return a.order - b.order; });
    });
  }

  // ========== 批注操作 ==========

  function createAnnotation(data) {
    const annotation = {
      id: crypto.randomUUID(),
      promptId: data.promptId,
      content: data.content || '',
      created: Date.now()
    };
    return db.add('annotations', annotation);
  }

  function updateAnnotation(id, content) {
    return db.get('annotations', id).then(function(anno) {
      if (!anno) throw new Error('批注不存在: ' + id);
      return db.update('annotations', Object.assign({}, anno, { content: content }));
    });
  }

  function deleteAnnotation(id) {
    return db.delete('annotations', id);
  }

  function getAnnotationsByPrompt(promptId) {
    return db.getByIndex('annotations', 'by_promptId', promptId).then(function(annotations) {
      return annotations.sort(function(a, b) { return b.created - a.created; });
    });
  }

  // ========== 标签操作 ==========

  function getAllTags() {
    return db.getAll('prompts').then(function(prompts) {
      var tagMap = {};
      prompts.forEach(function(p) {
        (p.tags || []).forEach(function(tag) {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        });
      });
      return Object.keys(tagMap).map(function(name) {
        return { name: name, count: tagMap[name] };
      }).sort(function(a, b) { return b.count - a.count; });
    });
  }

  // ========== 搜索 ==========

  function searchPrompts(query, filters) {
    filters = filters || {};
    var lowerQuery = query.toLowerCase().trim();
    return Promise.all([
      db.getAll('prompts'),
      db.getAll('annotations'),
      db.getAll('groups')
    ]).then(function(results) {
      var prompts = results[0];
      var annotations = results[1];
      var groups = results[2];

      // 为每条提示词构建批注内容汇总
      var annoByPrompt = {};
      annotations.forEach(function(a) {
        if (!annoByPrompt[a.promptId]) annoByPrompt[a.promptId] = [];
        annoByPrompt[a.promptId].push(a.content);
      });

      // 构建分组 id → name 映射
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });

      var results = prompts.filter(function(p) {
        // 搜索过滤
        if (lowerQuery) {
          var titleMatch = p.title.toLowerCase().includes(lowerQuery);
          var contentMatch = p.content.toLowerCase().includes(lowerQuery);
          var tagMatch = (p.tags || []).some(function(t) { return t.toLowerCase().includes(lowerQuery); });
          var annoMatch = (annoByPrompt[p.id] || []).some(function(c) { return c.toLowerCase().includes(lowerQuery); });
          if (!titleMatch && !contentMatch && !tagMatch && !annoMatch) return false;
        }
        // 分组过滤
        if (filters.groupId && p.groupId !== filters.groupId) return false;
        // 标签过滤
        if (filters.tag && !(p.tags || []).includes(filters.tag)) return false;
        // 时间过滤
        if (filters.since && p.updated < filters.since) return false;
        return true;
      });

      // 计算相关度并排序
      results.forEach(function(p) {
        var score = 0;
        if (lowerQuery) {
          if (p.title.toLowerCase().includes(lowerQuery)) score += 3;
          if (p.content.toLowerCase().includes(lowerQuery)) score += 1;
          if ((p.tags || []).some(function(t) { return t.toLowerCase().includes(lowerQuery); })) score += 2;
          if ((annoByPrompt[p.id] || []).some(function(c) { return c.toLowerCase().includes(lowerQuery); })) score += 1;
        }
        p._score = score;
        p._groupName = groupNameMap[p.groupId] || '未分组';
      });

      // 排序：相关度 > 更新时间
      results.sort(function(a, b) {
        if (b._score !== a._score) return b._score - a._score;
        return b.updated - a.updated;
      });

      return results;
    });
  }

  // ========== 导入导出 ==========

  function exportAll() {
    return Promise.all([
      db.getAll('prompts'),
      db.getAll('groups'),
      db.getAll('annotations')
    ]).then(function(results) {
      return {
        version: 1,
        exportTime: Date.now(),
        prompts: results[0],
        groups: results[1],
        annotations: results[2]
      };
    });
  }

  function importAll(data, mode) {
    if (!data || !data.prompts && !data.groups) {
      return Promise.reject(new Error('无效的备份文件格式'));
    }
    var tasks = [];
    if (mode === 'overwrite') {
      tasks.push(db.clear('prompts'));
      tasks.push(db.clear('groups'));
      tasks.push(db.clear('annotations'));
    }
    return Promise.all(tasks).then(function() {
      var promise = Promise.resolve();
      // 导入分组
      (data.groups || []).forEach(function(g) {
        promise = promise.then(function() {
          if (mode === 'merge') {
            return db.get('groups', g.id).then(function(existing) {
              if (!existing) return db.add('groups', g);
              return db.update('groups', g);
            });
          }
          return db.add('groups', g).catch(function() { return db.update('groups', g); });
        });
      });
      // 导入提示词
      (data.prompts || []).forEach(function(p) {
        promise = promise.then(function() {
          if (mode === 'merge') {
            return db.get('prompts', p.id).then(function(existing) {
              if (!existing) return db.add('prompts', p);
              return db.update('prompts', p);
            });
          }
          return db.add('prompts', p).catch(function() { return db.update('prompts', p); });
        });
      });
      // 导入批注
      (data.annotations || []).forEach(function(a) {
        promise = promise.then(function() {
          if (mode === 'merge') {
            return db.get('annotations', a.id).then(function(existing) {
              if (!existing) return db.add('annotations', a);
              return db.update('annotations', a);
            });
          }
          return db.add('annotations', a).catch(function() { return db.update('annotations', a); });
        });
      });
      return promise;
    });
  }

  // ========== 关系操作 ==========

  function createLink(sourceId, targetId) {
    const link = {
      id: crypto.randomUUID(),
      source: sourceId,
      target: targetId,
      type: 'custom',
      created: Date.now()
    };
    return db.add('links', link);
  }

  function deleteLink(sourceId, targetId) {
    return db.getByIndex('links', 'by_source', sourceId).then(function(links) {
      const link = links.find(function(l) { return l.target === targetId; });
      if (!link) throw new Error('关系不存在');
      return db.delete('links', link.id);
    });
  }

  function getAllLinks() {
    return db.getAll('links');
  }

  // ========== 图谱数据 ==========

  function getGraphData() {
    return Promise.all([
      db.getAll('prompts'),
      db.getAll('groups'),
      getAllTags(),
      getAllLinks()
    ]).then(function(results) {
      var prompts = results[0];
      var groups = results[1];
      var tags = results[2];
      var customLinks = results[3];
      var nodes = [];
      var links = [];

      // 提示词节点
      prompts.forEach(function(p) {
        nodes.push({
          id: 'p_' + p.id,
          refId: p.id,
          type: 'prompt',
          name: p.title,
          color: '#4A90D9',
          shape: 'circle'
        });
      });

      // 分组节点
      groups.forEach(function(g) {
        nodes.push({
          id: 'g_' + g.id,
          refId: g.id,
          type: 'group',
          name: g.name,
          color: '#5CB85C',
          shape: 'rect'
        });
      });

      // 标签节点
      tags.forEach(function(t) {
        nodes.push({
          id: 't_' + t.name,
          refId: t.name,
          type: 'tag',
          name: t.name,
          color: '#F0AD4E',
          shape: 'diamond'
        });
      });

      // 边：提示词 → 分组
      prompts.forEach(function(p) {
        if (p.groupId) {
          links.push({ source: 'p_' + p.id, target: 'g_' + p.groupId, type: 'belongs' });
        }
      });

      // 边：提示词 → 标签
      prompts.forEach(function(p) {
        (p.tags || []).forEach(function(tag) {
          links.push({ source: 'p_' + p.id, target: 't_' + tag, type: 'tagged' });
        });
      });

      // 添加自定义关系
      customLinks.forEach(function(link) {
        links.push({ source: link.source, target: link.target, type: 'custom' });
      });

      return { nodes: nodes, links: links };
    });
  }

  // 导出到全局
  window.CyberBible = window.CyberBible || {};
  window.CyberBible.store = {
    // 提示词
    createPrompt: createPrompt,
    updatePrompt: updatePrompt,
    deletePrompt: deletePrompt,
    getPrompt: getPrompt,
    getAllPrompts: getAllPrompts,
    // 分组
    createGroup: createGroup,
    updateGroup: updateGroup,
    deleteGroup: deleteGroup,
    getAllGroups: getAllGroups,
    // 批注
    createAnnotation: createAnnotation,
    updateAnnotation: updateAnnotation,
    deleteAnnotation: deleteAnnotation,
    getAnnotationsByPrompt: getAnnotationsByPrompt,
    // 标签
    getAllTags: getAllTags,
    // 搜索
    searchPrompts: searchPrompts,
    // 导入导出
    exportAll: exportAll,
    importAll: importAll,
    // 关系
    createLink: createLink,
    deleteLink: deleteLink,
    getAllLinks: getAllLinks,
    // 图谱
    getGraphData: getGraphData
  };
})();





