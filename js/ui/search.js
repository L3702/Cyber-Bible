// Cyber Bible - 搜索模块
(function() {
  var store = window.CyberBible.store;
  var components = window.CyberBible.ui.components;
  var utils = window.CyberBible.utils;
  var currentQuery = '';
  var currentFilters = {};

  async function render(container) {
    await performSearch(container, '', {});
  }

  async function renderWithTag(container, tagName) {
    await performSearch(container, '', { tag: tagName });
  }

  async function performSearch(container, query, filters) {
    currentQuery = query;
    currentFilters = filters || {};
    
    container.innerHTML = '<div class="section-title">🔍 搜索结果</div>' +
      '<div class="search-layout">' +
      '<div class="search-filters"><div class="filter-group"><h4>分组</h4><div id="filter-groups"></div></div>' +
      '<div class="filter-group"><h4>标签</h4><div id="filter-tags"></div></div></div>' +
      '<div class="search-main"><div id="search-results-area"></div></div>' +
      '</div>';
    
    try {
      var results = await store.searchPrompts(currentQuery, currentFilters);
      var groups = await store.getAllGroups();
      var tags = await store.getAllTags();
      
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });
      
      // Render filters
      var groupsFilter = container.querySelector('#filter-groups');
      groupsFilter.innerHTML = '';
      var allGroupBtn = document.createElement('div');
      allGroupBtn.style.cssText = 'cursor:pointer;padding:4px 0;color:' + (currentFilters.groupId ? '#333' : 'var(--color-primary)') + ';font-weight:' + (currentFilters.groupId ? 'normal' : 'bold');
      allGroupBtn.textContent = '全部分组';
      allGroupBtn.addEventListener('click', function() {
        currentFilters.groupId = null;
        performSearch(container, currentQuery, currentFilters);
      });
      groupsFilter.appendChild(allGroupBtn);
      
      groups.forEach(function(g) {
        var btn = document.createElement('div');
        btn.style.cssText = 'cursor:pointer;padding:4px 0;color:' + (currentFilters.groupId === g.id ? 'var(--color-primary)' : '#333') + ';font-weight:' + (currentFilters.groupId === g.id ? 'bold' : 'normal');
        btn.textContent = g.name;
        btn.addEventListener('click', function() {
          currentFilters.groupId = g.id;
          performSearch(container, currentQuery, currentFilters);
        });
        groupsFilter.appendChild(btn);
      });
      
      var tagsFilter = container.querySelector('#filter-tags');
      tagsFilter.innerHTML = '';
      var allTagBtn = document.createElement('div');
      allTagBtn.style.cssText = 'cursor:pointer;padding:4px 0;color:' + (currentFilters.tag ? '#333' : 'var(--color-primary)') + ';font-weight:' + (currentFilters.tag ? 'normal' : 'bold');
      allTagBtn.textContent = '全部标签';
      allTagBtn.addEventListener('click', function() {
        currentFilters.tag = null;
        performSearch(container, currentQuery, currentFilters);
      });
      tagsFilter.appendChild(allTagBtn);
      
      tags.forEach(function(t) {
        var btn = document.createElement('div');
        btn.style.cssText = 'cursor:pointer;padding:4px 0;color:' + (currentFilters.tag === t.name ? 'var(--color-primary)' : '#333') + ';font-weight:' + (currentFilters.tag === t.name ? 'bold' : 'normal');
        btn.textContent = t.name + ' (' + t.count + ')';
        btn.addEventListener('click', function() {
          currentFilters.tag = t.name;
          performSearch(container, currentQuery, currentFilters);
        });
        tagsFilter.appendChild(btn);
      });
      
      // Render results
      var resultsArea = container.querySelector('#search-results-area');
      resultsArea.innerHTML = '<div style="margin-bottom:12px;color:#666">找到 ' + results.length + ' 条结果</div>';
      var grid = document.createElement('div');
      grid.className = 'prompt-grid';
      
      results.forEach(function(p) {
        var card = components.createPromptCard(p, groupNameMap[p.groupId]);
        // Highlight title
        var titleEl = card.querySelector('.card-title');
        titleEl.innerHTML = utils.highlightText(p.title, currentQuery);
        card.addEventListener('click', function() {
          if (window.CyberBible.ui.promptDetail) {
            window.CyberBible.ui.promptDetail.openView(p.id);
          }
        });
        grid.appendChild(card);
      });
      
      if (results.length === 0) {
        grid.appendChild(components.createEmptyState(currentQuery ? '没有匹配的结果' : '输入关键词开始搜索'));
      }
      
      resultsArea.appendChild(grid);
      
    } catch(e) {
      container.querySelector('#search-results-area').innerHTML = '<div class="empty-state">搜索失败: ' + utils.escapeHtml(e.message) + '</div>';
    }
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.search = {
    render: render,
    renderWithTag: renderWithTag
  };
})();
