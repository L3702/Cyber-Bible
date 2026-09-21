const fs = require('fs');
let content = fs.readFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', 'utf8');

// 1. Add grid background and zoom controls to render function
const oldRender = `'<div class="graph-container">' +
      '<svg class="graph-svg"></svg>' +
      '<div class="graph-legend"><div>● 提示词</div><div>■ 分组</div><div>◆ 标签</div></div>' +
      '<div id="graph-detail" style="position:absolute;top:12px;right:12px;width:250px;background:rgba(255,255,255,0.95);border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:none"></div>' +
      '</div>'`;

const newRender = `'<div class="graph-container" style="position:relative;overflow:hidden;background:#fafafa;border-radius:8px;border:1px solid #e0e0e0">' +
      '<svg class="graph-svg" style="display:block"></svg>' +
      '<div class="graph-legend" style="position:absolute;bottom:12px;left:12px;background:rgba(255,255,255,0.9);border-radius:6px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,0.1);font-size:12px"><div>● 提示词</div><div>■ 分组</div><div>◆ 标签</div></div>' +
      '<div class="graph-zoom-controls" style="position:absolute;bottom:12px;right:12px;display:flex;gap:4px;background:rgba(255,255,255,0.9);border-radius:6px;padding:4px;box-shadow:0 1px 4px rgba(0,0,0,0.1)">' +
      '<button id="btn-zoom-in" class="btn btn-sm btn-secondary" style="padding:4px 8px;font-size:14px">+</button>' +
      '<button id="btn-zoom-out" class="btn btn-sm btn-secondary" style="padding:4px 8px;font-size:14px">-</button>' +
      '<button id="btn-zoom-reset" class="btn btn-sm btn-secondary" style="padding:4px 8px;font-size:12px">1:1</button>' +
      '</div>' +
      '<div id="graph-detail" style="position:absolute;top:12px;right:12px;width:250px;background:rgba(255,255,255,0.95);border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:none"></div>' +
      '</div>'`;

content = content.replace(oldRender, newRender);

// 2. Add zoom control event bindings after toolbar bindings
const oldBindings = `if (cancelBtn) cancelBtn.addEventListener('click', cancelEditMode);`;
const newBindings = `if (cancelBtn) cancelBtn.addEventListener('click', cancelEditMode);
    
    // Zoom controls
    var zoomInBtn = container.querySelector('#btn-zoom-in');
    var zoomOutBtn = container.querySelector('#btn-zoom-out');
    var zoomResetBtn = container.querySelector('#btn-zoom-reset');
    if (zoomInBtn) zoomInBtn.addEventListener('click', function() { zoom(1.2); });
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', function() { zoom(0.8); });
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', function() { resetZoom(); });`;

content = content.replace(oldBindings, newBindings);

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', content, 'utf8');
console.log('Done');
