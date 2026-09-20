// Cyber Bible - 应用入口
(function() {
  var store = window.CyberBible.store;
  var layout = window.CyberBible.ui.layout;
  var components = window.CyberBible.ui.components;
  var utils = window.CyberBible.utils;

  // 初始化应用
  async function init() {
    try {
      // 打开数据库
      await window.CyberBible.db.openDB();
      
      // 渲染布局
      layout.renderLayout();
      
      // 绑定顶部工具栏事件
      bindToolbarEvents();
      
      // 默认加载首页
      layout.switchView('home');
      
      // 首次使用提示
      checkFirstUse();
      
    } catch (e) {
      console.error('初始化失败:', e);
      document.getElementById('content').innerHTML = 
        '<div class="empty-state">初始化失败: ' + utils.escapeHtml(e.message) + '</div>';
    }
  }

  // 绑定顶部工具栏事件
  function bindToolbarEvents() {
    // 新建按钮
    var btnNew = document.getElementById('btn-new');
    btnNew.addEventListener('click', function() {
      if (window.CyberBible.ui.promptDetail) {
        window.CyberBible.ui.promptDetail.openNew();
      }
    });

    // 全局搜索
    var searchInput = document.getElementById('global-search');
    var searchResults = document.getElementById('search-results');
    
    var debouncedSearch = utils.debounce(function() {
      var query = searchInput.value.trim();
      if (!query) {
        searchResults.classList.add('hidden');
        return;
      }
      performSearch(query, searchResults);
    }, 300);

    searchInput.addEventListener('input', debouncedSearch);
    
    searchInput.addEventListener('focus', function() {
      if (searchInput.value.trim()) {
        debouncedSearch();
      }
    });

    // 点击外部关闭搜索结果
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }

  // 执行搜索
  async function performSearch(query, resultsContainer) {
    try {
      var results = await store.searchPrompts(query);
      resultsContainer.innerHTML = '';
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:12px;color:#999;text-align:center">无搜索结果</div>';
      } else {
        results.slice(0, 10).forEach(function(p) {
          var item = document.createElement('div');
          item.style.padding = '8px 12px';
          item.style.cursor = 'pointer';
          item.style.borderBottom = '1px solid #eee';
          item.innerHTML = utils.highlightText(p.title, query) + 
            '<div style="font-size:12px;color:#999">' + utils.escapeHtml(p._groupName || '未分组') + '</div>';
          item.addEventListener('click', function() {
            resultsContainer.classList.add('hidden');
            searchInput.value = '';
            if (window.CyberBible.ui.promptDetail) {
              window.CyberBible.ui.promptDetail.openView(p.id);
            }
          });
          item.addEventListener('mouseenter', function() { item.style.background = '#f5f5f5'; });
          item.addEventListener('mouseleave', function() { item.style.background = ''; });
          resultsContainer.appendChild(item);
        });
      }
      
      resultsContainer.classList.remove('hidden');
    } catch (e) {
      console.error('搜索失败:', e);
    }
  }

  // 首次使用提示
  function checkFirstUse() {
    var hasVisited = localStorage.getItem('cyber_bible_visited');
    if (!hasVisited) {
      localStorage.setItem('cyber_bible_visited', '1');
      components.showToast('欢迎使用 Cyber Bible！数据完全保存在本地 🔒', 'info');
    }
  }

  // DOMContentLoaded 时启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
