// Cyber Bible - 提示词详情/编辑模块
(function() {
  var store = window.CyberBible.store;
  var components = window.CyberBible.ui.components;
  var utils = window.CyberBible.utils;

  function openNew() {
    renderDetail(null, 'edit');
  }

  function openView(id) {
    renderDetail(id, 'view');
  }

  function openEdit(id) {
    renderDetail(id, 'edit');
  }

  async function renderDetail(id, mode) {
    var panel = document.getElementById('detail-panel');
    var content = document.getElementById('detail-content');
    
    panel.classList.remove('hidden');
    content.innerHTML = '<div style="padding:20px;text-align:center">加载中...</div>';
    
    try {
      var prompt = id ? await store.getPrompt(id) : { id: null, title: '', content: '', tags: [], groupId: null };
      if (id && !prompt) {
        content.innerHTML = '<div style="padding:20px;text-align:center;color:#999">提示词不存在</div>';
        return;
      }
      
      var groups = await store.getAllGroups();
      var annotations = id ? await store.getAnnotationsByPrompt(id) : [];
      var allTags = await store.getAllTags();
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });
      
      if (mode === 'view') {
        renderView(content, prompt, groups, groupNameMap, annotations, allTags);
      } else {
        renderEdit(content, prompt, groups, groupNameMap, annotations, allTags);
      }
    } catch(e) {
      content.innerHTML = '<div style="padding:20px;text-align:center;color:#999">加载失败: ' + utils.escapeHtml(e.message) + '</div>';
    }
  }

  function renderEdit(container, prompt, groups, groupNameMap, annotations, allTags) {
    var isNew = !prompt.id;
    container.innerHTML = '<div class="detail-header">' +
      '<h3>' + (isNew ? '新建提示词' : '编辑提示词') + '</h3>' +
      '<button class="icon-btn" id="detail-close">✕</button></div>' +
      '<div class="detail-body">' +
      '<div class="form-group"><label>标题</label><input type="text" id="edit-title" value="' + utils.escapeHtml(prompt.title) + '" placeholder="输入标题"></div>' +
      '<div class="form-group"><label>内容</label><textarea id="edit-content" placeholder="输入提示词内容">' + utils.escapeHtml(prompt.content) + '</textarea></div>' +
      '<div class="form-group"><label>分组</label><select id="edit-group"><option value="">未分组</option>' +
      groups.map(function(g) { return '<option value="' + g.id + '"' + (prompt.groupId === g.id ? ' selected' : '') + '>' + utils.escapeHtml(g.name) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-group"><label>标签</label>' +
      '<div id="edit-tags" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">' +
      (prompt.tags || []).map(function(t) { return '<span class="tag">' + utils.escapeHtml(t) + '<span class="remove" data-tag="' + utils.escapeHtml(t) + '">×</span></span>'; }).join('') +
      '</div>' +
      '<input type="text" id="tag-input" placeholder="输入标签后回车添加" list="tag-suggestions">' +
      '<datalist id="tag-suggestions">' + allTags.map(function(t) { return '<option value="' + utils.escapeHtml(t.name) + '>'; }).join('') + '</datalist>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px">' +
      '<button class="btn btn-primary" id="btn-save">' + (isNew ? '创建' : '保存') + '</button>' +
      (isNew ? '' : '<button class="btn btn-secondary" id="btn-view">切换到查看</button>') +
      '<button class="btn btn-secondary" id="btn-cancel">取消</button>' +
      (isNew ? '' : '<button class="btn btn-danger" id="btn-delete">删除</button>') +
      '</div>' +
      '</div>';
    
    // Close button
    container.querySelector('#detail-close').addEventListener('click', closeDetail);
    
    // Remove tags
    container.querySelectorAll('.remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        btn.parentElement.remove();
      });
    });
    
    // Add tag
    var tagInput = container.querySelector('#tag-input');
    tagInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        var tag = this.value.trim();
        var existing = container.querySelectorAll('#edit-tags .tag');
        for (var i = 0; i < existing.length; i++) {
          if (existing[i].childNodes[0].textContent === tag) {
            this.value = '';
            return;
          }
        }
        var tagEl = components.createTag(tag, true, function() { tagEl.remove(); });
        container.querySelector('#edit-tags').appendChild(tagEl);
        this.value = '';
      }
    });
    
    // Save
    container.querySelector('#btn-save').addEventListener('click', async function() {
      var title = container.querySelector('#edit-title').value.trim() || '无标题';
      var content = container.querySelector('#edit-content').value;
      var groupId = container.querySelector('#edit-group').value || null;
      var tags = [];
      container.querySelectorAll('#edit-tags .tag').forEach(function(el) {
        tags.push(el.childNodes[0].textContent);
      });
      
      try {
        if (isNew) {
          var p = await store.createPrompt({ title: title, content: content, groupId: groupId, tags: tags });
          components.showToast('创建成功', 'success');
          closeDetail();
          refreshCurrentView();
        } else {
          await store.updatePrompt(prompt.id, { title: title, content: content, groupId: groupId, tags: tags });
          components.showToast('保存成功', 'success');
          renderDetail(prompt.id, 'view');
          refreshCurrentView();
        }
      } catch(e) {
        components.showToast('保存失败: ' + e.message, 'error');
      }
    });
    
    // Switch to view
    var viewBtn = container.querySelector('#btn-view');
    if (viewBtn) {
      viewBtn.addEventListener('click', function() { renderDetail(prompt.id, 'view'); });
    }
    
    // Cancel
    container.querySelector('#btn-cancel').addEventListener('click', closeDetail);
    
    // Delete
    var delBtn = container.querySelector('#btn-delete');
    if (delBtn) {
      delBtn.addEventListener('click', function() {
        components.showModal('确认删除', '<p>确定要删除这条提示词吗？</p>', async function() {
          await store.deletePrompt(prompt.id);
          components.showToast('已删除', 'success');
          closeDetail();
          refreshCurrentView();
        });
      });
    }
  }

  function renderView(container, prompt, groups, groupNameMap, annotations, allTags) {
    container.innerHTML = '<div class="detail-header">' +
      '<h3>提示词详情</h3>' +
      '<button class="icon-btn" id="detail-close">✕</button></div>' +
      '<div class="detail-body">' +
      '<h2 style="margin-bottom:16px">' + utils.escapeHtml(prompt.title) + '</h2>' +
      '<div style="margin-bottom:12px">' +
      '<span style="color:#666;font-size:13px">分组: </span>' +
      '<span class="tag" style="background:rgba(92,184,92,0.15);color:#5CB85C">' + utils.escapeHtml(groupNameMap[prompt.groupId] || '未分组') + '</span>' +
      '</div>' +
      '<div style="margin-bottom:16px">' +
      (prompt.tags || []).length > 0 ? '<div style="color:#666;font-size:13px;margin-bottom:4px">标签:</div>' : '' +
      '<div>' + (prompt.tags || []).map(function(t) { return '<span class="tag">' + utils.escapeHtml(t) + '</span>'; }).join('') + '</div>' +
      '</div>' +
      '<div style="margin-bottom:16px">' +
      '<div style="color:#666;font-size:13px;margin-bottom:4px">内容:</div>' +
      '<pre style="background:#f5f5f5;padding:16px;border-radius:8px;white-space:pre-wrap;word-break:break-word;font-family:Consolas,Monaco,monospace;font-size:13px">' + utils.escapeHtml(prompt.content) + '</pre>' +
      '<button class="btn btn-secondary btn-sm" id="btn-copy" style="margin-top:8px">📋 复制内容</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:24px">' +
      '<button class="btn btn-primary" id="btn-edit">编辑</button>' +
      '<button class="btn btn-danger" id="btn-delete">删除</button>' +
      '</div>' +
      '<div style="border-top:1px solid #eee;padding-top:16px">' +
      '<div style="font-weight:600;margin-bottom:12px">📝 批注 (' + annotations.length + ')</div>' +
      '<div id="annotations-list">' +
      annotations.map(function(a) { return renderAnnotation(a); }).join('') +
      '</div>' +
      '<div style="margin-top:12px">' +
      '<textarea id="new-annotation" placeholder="添加批注..." style="width:100%;min-height:60px;padding:8px;border:1px solid #ddd;border-radius:4px;resize:vertical"></textarea>' +
      '<button class="btn btn-primary btn-sm" id="btn-add-annotation" style="margin-top:8px">添加批注</button>' +
      '</div>' +
      '</div>' +
      '<div style="color:#999;font-size:12px;margin-top:16px;border-top:1px solid #eee;padding-top:12px">' +
      '创建: ' + utils.formatDateTime(prompt.created) + ' | 修改: ' + utils.formatDateTime(prompt.updated) +
      '</div>' +
      '</div>';
    
    // Close
    container.querySelector('#detail-close').addEventListener('click', closeDetail);
    
    // Copy
    container.querySelector('#btn-copy').addEventListener('click', function() {
      navigator.clipboard.writeText(prompt.content).then(function() {
        components.showToast('已复制到剪贴板', 'success');
      });
    });
    
    // Edit
    container.querySelector('#btn-edit').addEventListener('click', function() { renderDetail(prompt.id, 'edit'); });
    
    // Delete
    container.querySelector('#btn-delete').addEventListener('click', function() {
      components.showModal('确认删除', '<p>确定要删除这条提示词吗？</p>', async function() {
        await store.deletePrompt(prompt.id);
        components.showToast('已删除', 'success');
        closeDetail();
        refreshCurrentView();
      });
    });
    
    // Add annotation
    container.querySelector('#btn-add-annotation').addEventListener('click', async function() {
      var input = container.querySelector('#new-annotation');
      var content = input.value.trim();
      if (!content) return;
      try {
        await store.createAnnotation({ promptId: prompt.id, content: content });
        input.value = '';
        components.showToast('批注已添加', 'success');
        renderDetail(prompt.id, 'view');
        refreshCurrentView();
      } catch(e) {
        components.showToast('添加失败: ' + e.message, 'error');
      }
    });
    
    // Annotation actions
    container.querySelectorAll('.annotation-edit').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.id;
        var currentContent = btn.dataset.content;
        components.showInputModal('编辑批注', '请输入批注内容', currentContent, async function(newContent) {
          await store.updateAnnotation(id, newContent);
          renderDetail(prompt.id, 'view');
          refreshCurrentView();
        });
      });
    });
    
    container.querySelectorAll('.annotation-delete').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var id = btn.dataset.id;
        await store.deleteAnnotation(id);
        components.showToast('批注已删除', 'success');
        renderDetail(prompt.id, 'view');
        refreshCurrentView();
      });
    });
  }

  function renderAnnotation(a) {
    return '<div class="annotation">' +
      '<div class="annotation-time">' + utils.formatDateTime(a.created) +
      '<span class="annotation-actions">' +
      '<button class="annotation-edit" data-id="' + a.id + '" data-content="' + utils.escapeHtml(a.content) + '" style="background:none;border:none;cursor:pointer;color:#4A90D9;margin-right:8px">编辑</button>' +
      '<button class="annotation-delete" data-id="' + a.id + '" style="background:none;border:none;cursor:pointer;color:#D9534F">删除</button>' +
      '</span></div>' +
      '<div>' + utils.escapeHtml(a.content) + '</div>' +
      '</div>';
  }

  function closeDetail() {
    document.getElementById('detail-panel').classList.add('hidden');
  }

  function refreshCurrentView() {
    var view = window.CyberBible.ui.layout.getCurrentView();
    window.CyberBible.ui.layout.switchView(view);
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.promptDetail = {
    openNew: openNew,
    openView: openView,
    openEdit: openEdit
  };
})();
