// Cyber Bible - 通用 UI 组件
(function() {
  var utils = window.CyberBible.utils;

  // 显示确认弹窗
  function showModal(title, contentHTML, onConfirm, onCancel) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    var modal = document.createElement('div');
    modal.className = 'modal';
    
    var titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    
    var contentEl = document.createElement('div');
    contentEl.className = 'modal-content';
    contentEl.innerHTML = contentHTML;
    
    var footer = document.createElement('div');
    footer.className = 'modal-footer';
    
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', function() {
      close();
      if (onCancel) onCancel();
    });
    
    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = '确定';
    confirmBtn.addEventListener('click', function() {
      close();
      if (onConfirm) onConfirm();
    });
    
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    
    modal.appendChild(titleEl);
    modal.appendChild(contentEl);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    
    function close() {
      overlay.remove();
    }
    
    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    
    document.body.appendChild(overlay);
    
    // 自动聚焦到输入框
    var input = modal.querySelector('input, textarea');
    if (input) input.focus();
    
    return { close: close };
  }

  // 显示输入弹窗
  function showInputModal(title, placeholder, defaultValue, onSubmit) {
    var inputId = 'modal-input-' + Date.now();
    var html = '<div class="form-group">' +
      '<input type="text" id="' + inputId + '" placeholder="' + utils.escapeHtml(placeholder || '') + '" value="' + utils.escapeHtml(defaultValue || '') + '">' +
      '</div>';
    
    // Create modal with reference to input element
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var modal = document.createElement('div');
    modal.className = 'modal';
    var titleEl = document.createElement('div');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    var contentEl = document.createElement('div');
    contentEl.className = 'modal-content';
    contentEl.innerHTML = html;
    var footer = document.createElement('div');
    footer.className = 'modal-footer';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = '取消';
    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = '确定';
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);
    modal.appendChild(titleEl);
    modal.appendChild(contentEl);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    
    var inputEl = contentEl.querySelector('input');
    
    cancelBtn.addEventListener('click', function() {
      overlay.remove();
    });
    confirmBtn.addEventListener('click', function() {
      var val = inputEl ? inputEl.value.trim() : '';
      overlay.remove();
      if (val && onSubmit) onSubmit(val);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
    if (inputEl) inputEl.focus();
  }

  // 显示 Toast 提示
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
  }

  // 创建提示词卡片
  function createPromptCard(prompt, groupName) {
    var card = document.createElement('div');
    card.className = 'card prompt-card';
    card.dataset.id = prompt.id;
    
    var title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = prompt.title;
    
    var preview = document.createElement('div');
    preview.className = 'card-preview';
    preview.textContent = (prompt.content || '').substring(0, 100) || '（无内容）';
    
    var meta = document.createElement('div');
    meta.style.marginTop = '8px';
    meta.style.display = 'flex';
    meta.style.justifyContent = 'space-between';
    meta.style.alignItems = 'center';
    
    var tags = document.createElement('div');
    (prompt.tags || []).forEach(function(tag) {
      var tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.textContent = tag;
      tags.appendChild(tagEl);
    });
    
    var info = document.createElement('span');
    info.style.fontSize = '12px';
    info.style.color = '#999';
    info.textContent = groupName || prompt._groupName || '未分组';
    
    meta.appendChild(tags);
    meta.appendChild(info);
    
    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(meta);
    
    return card;
  }

  // 创建标签元素
  function createTag(tagName, removable, onRemove) {
    var span = document.createElement('span');
    span.className = 'tag';
    span.textContent = tagName;
    
    if (removable) {
      var remove = document.createElement('span');
      remove.className = 'remove';
      remove.textContent = '×';
      remove.addEventListener('click', function(e) {
        e.stopPropagation();
        if (onRemove) onRemove(tagName);
        span.remove();
      });
      span.appendChild(remove);
    }
    
    return span;
  }

  // 创建空状态
  function createEmptyState(message) {
    var div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = '<div style="font-size:48px;margin-bottom:16px">📭</div>' +
      '<div>' + utils.escapeHtml(message) + '</div>';
    return div;
  }

  // 创建统计卡片
  function createStatCard(number, label) {
    var card = document.createElement('div');
    card.className = 'stat-card';
    card.innerHTML = '<div class="stat-number">' + number + '</div>' +
      '<div class="stat-label">' + utils.escapeHtml(label) + '</div>';
    return card;
  }

  // 导出
  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.components = {
    showModal: showModal,
    showInputModal: showInputModal,
    showToast: showToast,
    createPromptCard: createPromptCard,
    createTag: createTag,
    createEmptyState: createEmptyState,
    createStatCard: createStatCard
  };
})();
