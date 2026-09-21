const fs = require('fs');
let content = fs.readFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\groups.js', 'utf8');

// 1. Add delete button to group items
const oldGroupItem = `item.innerHTML = '<span>' + g.name + '</span><span style="color:#999;font-size:12px">' + count + '</span>';`;
const newGroupItem = `item.innerHTML = '<span>' + g.name + '</span><span style="color:#999;font-size:12px">' + count + '</span><button class="group-delete-btn" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#999;font-size:16px;padding:2px 6px;border-radius:4px" title="删除分组">✕</button>';`;

content = content.replace(oldGroupItem, newGroupItem);

// 2. Add delete button event listener after click event
const oldClickEvent = `item.addEventListener('click', function() {
          container.querySelectorAll('.group-item').forEach(function(i) { i.classList.remove('active'); });
          item.classList.add('active');
          renderPromptsList(container, g.id);
        });`;
const newClickEvent = `item.addEventListener('click', function(e) {
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
        }`;

content = content.replace(oldClickEvent, newClickEvent);

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\groups.js', content, 'utf8');
console.log('Done');
