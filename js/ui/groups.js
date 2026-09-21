// Cyber Bible - 分组管理模块
(function() {
  function render(container) {
    container.innerHTML = '<div class="section-title">📁 分组管理</div>' +
      '<div class="groups-layout">' +
      '<div class="groups-sidebar"><div class="empty-state">加载中...</div></div>' +
      '<div class="groups-main"><div class="empty-state">请选择一个分组查看提示词</div></div>' +
      '</div>';
    
    renderGroups(container);
  }

  async function renderGroups(container) {
    try {
      var store = window.CyberBible.store;
      var components = window.CyberBible.ui.components;
      var groups = await store.getAllGroups();
      var prompts = await store.getAllPrompts();
      
      var sidebar = container.querySelector('.groups-sidebar');
      sidebar.innerHTML = '';
      
      // 新建分组按钮
      var newBtn = document.createElement('button');
      newBtn.className = 'btn btn-primary btn-sm';
      newBtn.textContent = '+ 新建分组';
      newBtn.style.margin = '12px';
      newBtn.style.width = 'calc(100% - 24px)';
      newBtn.addEventListener('click', function() {
        components.showInputModal('新建分组', '请输入分组名称', '', async function(name) {
          await store.createGroup({ name: name });
          renderGroups(container);
          components.showToast('分组创建成功', 'success');
        });
      });
      sidebar.appendChild(newBtn);
      
      // 分组列表
      groups.forEach(function(g) {
        var count = prompts.filter(function(p) { return p.groupId === g.id; }).length;
        var item = document.createElement('div');
        item.className = 'group-item';
        item.dataset.id = g.id;
        item.innerHTML = '<span>' + g.name + '</span><span style="color:#999;font-size:12px">' + count + '</span><button class="group-delete-btn" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#999;font-size:16px;padding:2px 6px;border-radius:4px" title="删除分组">✕</button>';
        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('group-delete-btn')) return;
          container.querySelectorAll('.group-item').forEach(function(i) { i.classList.remove('active'); });
          item.classList.add('active');
          renderPromptsList(container, g.id);
        });
        
        // Delete button
        var deleteBtn = item.querySelector('.group-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            components.showModal('确认删除', '<p>确定要删除分组「' + g.name + '」吗？</p><p style="color:#999;font-size:13px;margin-top:8px">分组下的提示词将变为未分组状态。</p>', async function() {
              try {
                await store.deleteGroup(g.id, null);
                components.showToast('分组已删除', 'success');
                renderGroups(container);
              } catch(err) {
                components.showToast('删除失败: ' + err.message, 'error');
              }
            });
          });
        }
        sidebar.appendChild(item);
      });
      
      if (groups.length === 0) {
        sidebar.appendChild(components.createEmptyState('还没有分组'));
      }
    } catch(e) {
      console.error(e);
    }
  }

  async function renderPromptsList(container, groupId) {
    try {
      var store = window.CyberBible.store;
      var components = window.CyberBible.ui.components;
      var prompts = await store.getAllPrompts();
      var groups = await store.getAllGroups();
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });
      
      var filtered = prompts.filter(function(p) { return p.groupId === groupId; });
      var main = container.querySelector('.groups-main');
      main.innerHTML = '<div class="section-title">共 ' + filtered.length + ' 条提示词</div>';
      var grid = document.createElement('div');
      grid.className = 'prompt-grid';
      
      filtered.forEach(function(p) {
        var card = components.createPromptCard(p, groupNameMap[p.groupId]);
        card.addEventListener('click', function() {
          if (window.CyberBible.ui.promptDetail) {
            window.CyberBible.ui.promptDetail.openView(p.id);
          }
        });
        grid.appendChild(card);
      });
      
      if (filtered.length === 0) {
        grid.appendChild(components.createEmptyState('该分组下没有提示词'));
      }
      
      main.appendChild(grid);
    } catch(e) {
      console.error(e);
    }
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.groups = { render: render };
})();
