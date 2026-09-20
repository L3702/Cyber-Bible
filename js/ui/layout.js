// Cyber Bible - 页面布局
(function() {
  var content = null;
  var sidebarItems = null;
  var currentView = 'home';

  function renderLayout() {
    content = document.getElementById('content');
    sidebarItems = document.querySelectorAll('.nav-item');
    
    // 绑定导航点击
    sidebarItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var view = item.getAttribute('data-view');
        switchView(view);
      });
    });
  }

  function switchView(viewName) {
    currentView = viewName;
    
    // 更新导航状态
    sidebarItems.forEach(function(item) {
      item.classList.toggle('active', item.getAttribute('data-view') === viewName);
    });

    // 清空内容区
    content.innerHTML = '';

    // 根据视图名渲染对应内容
    switch (viewName) {
      case 'home':
        if (window.CyberBible.ui && window.CyberBible.ui.home) {
          window.CyberBible.ui.home.render(content);
        } else {
          content.innerHTML = '<div class="empty-state">首页模块加载中...</div>';
        }
        break;
      case 'groups':
        if (window.CyberBible.ui && window.CyberBible.ui.groups) {
          window.CyberBible.ui.groups.render(content);
        } else {
          content.innerHTML = '<div class="empty-state">分组模块加载中...</div>';
        }
        break;
      case 'graph':
        if (window.CyberBible.ui && window.CyberBible.ui.graph) {
          window.CyberBible.ui.graph.render(content);
        } else {
          content.innerHTML = '<div class="empty-state">图谱模块加载中...</div>';
        }
        break;
      case 'database':
        if (window.CyberBible.ui && window.CyberBible.ui.database) {
          window.CyberBible.ui.database.render(content);
        } else {
          content.innerHTML = '<div class="empty-state">数据库模块加载中...</div>';
        }
        break;
      default:
        content.innerHTML = '<div class="empty-state">页面不存在</div>';
    }
  }

  function getCurrentView() {
    return currentView;
  }

  // 导出
  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.layout = {
    renderLayout: renderLayout,
    switchView: switchView,
    getCurrentView: getCurrentView
  };
})();
