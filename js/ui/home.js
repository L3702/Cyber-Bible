// Cyber Bible - 首页模块
(function() {
  var store = window.CyberBible.store;
  var components = window.CyberBible.ui.components;
  var utils = window.CyberBible.utils;

  async function render(container) {
    container.innerHTML = '<div style="text-align:center;padding:40px">加载中...</div>';
    
    try {
      var [prompts, groups, tags, annotations] = await Promise.all([
        store.getAllPrompts(),
        store.getAllGroups(),
        store.getAllTags(),
        store.getAllAnnotations ? store.getAllAnnotations() : []
      ]);
      
      // Get all annotations count
      var annoCount = 0;
      for (var i = 0; i < prompts.length; i++) {
        var annos = await store.getAnnotationsByPrompt(prompts[i].id);
        annoCount += annos.length;
      }

      container.innerHTML = '';

      // 统计卡片
      var statsGrid = document.createElement('div');
      statsGrid.className = 'stats-grid';
      statsGrid.appendChild(components.createStatCard(prompts.length, '提示词'));
      statsGrid.appendChild(components.createStatCard(groups.length, '分组'));
      statsGrid.appendChild(components.createStatCard(tags.length, '标签'));
      statsGrid.appendChild(components.createStatCard(annoCount, '批注'));
      container.appendChild(statsGrid);

      // 最近添加
      var recentSection = document.createElement('div');
      recentSection.innerHTML = '<div class="section-title">🕐 最近添加</div>';
      var recentGrid = document.createElement('div');
      recentGrid.className = 'prompt-grid';
      
      var groupNameMap = {};
      groups.forEach(function(g) { groupNameMap[g.id] = g.name; });
      
      prompts.sort(function(a, b) { return b.updated - a.updated; })
        .slice(0, 5)
        .forEach(function(p) {
          var card = components.createPromptCard(p, groupNameMap[p.groupId]);
          card.addEventListener('click', function() {
            if (window.CyberBible.ui.promptDetail) {
              window.CyberBible.ui.promptDetail.openView(p.id);
            }
          });
          recentGrid.appendChild(card);
        });
      
      if (prompts.length === 0) {
        recentGrid.appendChild(components.createEmptyState('还没有提示词，点击右上角「+ 新建提示词」开始添加吧'));
      }
      
      recentSection.appendChild(recentGrid);
      container.appendChild(recentSection);

      // 热门标签
      if (tags.length > 0) {
        var tagSection = document.createElement('div');
        tagSection.style.marginTop = '24px';
        tagSection.innerHTML = '<div class="section-title">🏷️ 热门标签</div>';
        var tagCloud = document.createElement('div');
        tagCloud.className = 'tag-cloud';
        
        var maxCount = tags.length > 0 ? tags[0].count : 1;
        tags.slice(0, 20).forEach(function(t) {
          var tagEl = document.createElement('span');
          tagEl.className = 'tag';
          tagEl.textContent = t.name;
          var scale = 0.8 + (t.count / maxCount) * 0.8;
          tagEl.style.fontSize = (12 * scale) + 'px';
          tagEl.style.cursor = 'pointer';
          tagEl.addEventListener('click', function() {
            if (window.CyberBible.ui.search) {
              window.CyberBible.ui.search.renderWithTag(container, t.name);
            }
          });
          tagCloud.appendChild(tagEl);
        });
        
        tagSection.appendChild(tagCloud);
        container.appendChild(tagSection);
      }

    } catch (e) {
      container.innerHTML = '<div class="empty-state">加载失败: ' + utils.escapeHtml(e.message) + '</div>';
    }
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.home = { render: render };
})();
