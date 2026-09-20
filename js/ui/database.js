// Cyber Bible - 可视化数据库模块
(function() {
  var store = window.CyberBible.store;
  var components = window.CyberBible.ui.components;
  var utils = window.CyberBible.utils;
  var currentSort = { field: 'updated', dir: 'desc' };
  var currentFilters = {};

  async function render(container) {
    container.innerHTML = '<div class="section-title">💾 数据库</div>' +
      '<div class="filter-bar">' +
      '<select id="db-filter-group"><option value="">全部分组</option></select>' +
      '<select id="db-filter-tag"><option value="">全部标签</option></select>' +
      '<div style="flex:1"></div>' +
      '<button id="btn-export" class="btn btn-secondary btn-sm">📤 导出 JSON</button>' +
      '<button id="btn-import" class="btn btn-secondary btn-sm">📥 导入 JSON</button>' +
      '<input type="file" id="import-file" accept=".json" style="display:none">' +
      '</div>' +
      '<div id="db-table-area"></div>';
    
    // Bind events
    container.querySelector('#btn-export').addEventListener('click', doExport);
    container.querySelector('#btn-import').addEventListener('click', function() {
      container.querySelector('#import-file').click();
    });
    container.querySelector('#import-file').addEventListener('change', doImport);
    container.querySelector('#db-filter-group').addEventListener('change', function() {
      currentFilters.groupId = this.value || null;
      renderTable(container);
    });
    container.querySelector('#db-filter-tag').addEventListener('change', function() {
      currentFilters.tag = this.value || null;
      renderTable(container);
    });
    
    await renderTable(container);
  }

  async function renderTable(container) {
    try {
      var prompts = await store.getAllPrompts();
      var groups = await store.getAllGroups();
      var tags = await store.getAllTags();
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });
      
      // Apply filters
      if (currentFilters.groupId) {
        prompts = prompts.filter(function(p) { return p.groupId === currentFilters.groupId; });
      }
      if (currentFilters.tag) {
        prompts = prompts.filter(function(p) { return (p.tags || []).indexOf(currentFilters.tag) >= 0; });
      }
      
      // Get annotation counts
      var annoCounts = {};
      for (var i = 0; i < prompts.length; i++) {
        var annos = await store.getAnnotationsByPrompt(prompts[i].id);
        annoCounts[prompts[i].id] = annos.length;
      }
      
      // Sort
      prompts.sort(function(a, b) {
        var va = a[currentSort.field];
        var vb = b[currentSort.field];
        if (typeof va === 'string') {
          return currentSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        }
        return currentSort.dir === 'asc' ? (va || 0) - (vb || 0) : (vb || 0) - (va || 0);
      });
      
      // Update filter options
      var groupSelect = container.querySelector('#db-filter-group');
      var currentGroupVal = groupSelect.value;
      groupSelect.innerHTML = '<option value="">全部分组</option>';
      groups.forEach(function(g) {
        var opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        groupSelect.appendChild(opt);
      });
      groupSelect.value = currentGroupVal;
      
      var tagSelect = container.querySelector('#db-filter-tag');
      var currentTagVal = tagSelect.value;
      tagSelect.innerHTML = '<option value="">全部标签</option>';
      tags.forEach(function(t) {
        var opt = document.createElement('option');
        opt.value = t.name;
        opt.textContent = t.name + ' (' + t.count + ')';
        tagSelect.appendChild(opt);
      });
      tagSelect.value = currentTagVal;
      
      // Render table
      var tableArea = container.querySelector('#db-table-area');
      var table = document.createElement('table');
      table.className = 'data-table';
      
      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      var headers = [
        { field: 'title', label: '标题' },
        { field: 'group', label: '分组' },
        { field: 'tags', label: '标签' },
        { field: 'created', label: '创建时间' },
        { field: 'updated', label: '修改时间' },
        { field: 'annotations', label: '批注数' }
      ];
      
      headers.forEach(function(h) {
        var th = document.createElement('th');
        th.textContent = h.label;
        th.className = 'sort-indicator';
        if (currentSort.field === h.field) {
          th.classList.add(currentSort.dir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
        if (h.field !== 'group' && h.field !== 'tags' && h.field !== 'annotations') {
          th.addEventListener('click', function() {
            if (currentSort.field === h.field) {
              currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
            } else {
              currentSort.field = h.field;
              currentSort.dir = 'desc';
            }
            renderTable(container);
          });
        }
        headerRow.appendChild(th);
      });
      
      var actionTh = document.createElement('th');
      actionTh.textContent = '操作';
      headerRow.appendChild(actionTh);
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      var tbody = document.createElement('tbody');
      prompts.forEach(function(p) {
        var tr = document.createElement('tr');
        var groupTd = groupNameMap[p.groupId] || '未分组';
        var tagsHtml = (p.tags || []).map(function(t) { return '<span class="tag">' + utils.escapeHtml(t) + '</span>'; }).join(' ');
        
        tr.innerHTML = '<td>' + utils.escapeHtml(p.title) + '</td>' +
          '<td>' + utils.escapeHtml(groupTd) + '</td>' +
          '<td>' + tagsHtml + '</td>' +
          '<td>' + utils.formatDateTime(p.created) + '</td>' +
          '<td>' + utils.formatDateTime(p.updated) + '</td>' +
          '<td>' + annoCounts[p.id] + '</td>' +
          '<td><button class="btn btn-sm btn-secondary" data-action="view" data-id="' + p.id + '">查看</button> ' +
          '<button class="btn btn-sm btn-secondary" data-action="edit" data-id="' + p.id + '">编辑</button> ' +
          '<button class="btn btn-sm btn-danger" data-action="delete" data-id="' + p.id + '">删除</button></td>';
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      
      tableArea.innerHTML = '';
      if (prompts.length === 0) {
        tableArea.appendChild(components.createEmptyState('没有数据'));
      } else {
        tableArea.appendChild(table);
      }
      
      // Bind action buttons
      table.querySelectorAll('[data-action]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
          var action = btn.dataset.action;
          var id = btn.dataset.id;
          if (action === 'view' && window.CyberBible.ui.promptDetail) {
            window.CyberBible.ui.promptDetail.openView(id);
          } else if (action === 'edit' && window.CyberBible.ui.promptDetail) {
            window.CyberBible.ui.promptDetail.openEdit(id);
          } else if (action === 'delete') {
            components.showModal('确认删除', '<p>确定要删除这条提示词吗？相关批注也会被删除。</p>', async function() {
              await store.deletePrompt(id);
              components.showToast('已删除', 'success');
              renderTable(container);
            });
          }
        });
      });
      
    } catch(e) {
      container.querySelector('#db-table-area').innerHTML = '<div class="empty-state">加载失败: ' + utils.escapeHtml(e.message) + '</div>';
    }
  }

  async function doExport() {
    try {
      var data = await store.exportAll();
      var json = JSON.stringify(data, null, 2);
      var now = new Date();
      var filename = 'cyber_bible_backup_' + now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + '.json';
      utils.downloadFile(json, filename, 'application/json');
      components.showToast('导出成功', 'success');
    } catch(e) {
      components.showToast('导出失败: ' + e.message, 'error');
    }
  }

  async function doImport(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    try {
      var content = await utils.readFile(file);
      var data = JSON.parse(content);
      if (!data.prompts && !data.groups) {
        components.showToast('无效的备份文件格式', 'error');
        return;
      }
      
      components.showModal('导入方式', '<p>请选择导入方式：</p>' +
        '<div style="margin-top:12px"><label><input type="radio" name="import-mode" value="merge" checked> 合并（保留现有数据）</label></div>' +
        '<div><label><input type="radio" name="import-mode" value="overwrite"> 覆盖（清空现有数据）</label></div>',
        async function() {
          var mode = document.querySelector('input[name="import-mode"]:checked').value;
          await store.importAll(data, mode);
          components.showToast('导入成功', 'success');
          render(document.getElementById('content'));
        }
      );
    } catch(e) {
      components.showToast('导入失败: ' + e.message, 'error');
    }
    
    e.target.value = '';
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.database = { render: render };
})();
