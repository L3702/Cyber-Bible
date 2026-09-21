const fs = require('fs');
let content = fs.readFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', 'utf8');

// 3. Add zoom and resetZoom functions before startDrag
const oldStartDrag = `function startDrag(e, node) { dragNode = node; dragStart = { x: e.clientX, y: e.clientY }; }`;
const newStartDrag = `function zoom(factor) {
    var newK = Math.max(0.1, Math.min(5, transform.k * factor));
    // Zoom towards center
    var cx = width / 2, cy = height / 2;
    transform.x = cx - (cx - transform.x) * (newK / transform.k);
    transform.y = cy - (cy - transform.y) * (newK / transform.k);
    transform.k = newK;
    if (g) g.setAttribute("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
  }

  function resetZoom() {
    transform = { x: 0, y: 0, k: 1 };
    if (g) g.setAttribute("transform", "translate(0,0) scale(1)");
  }

  function startDrag(e, node) { dragNode = node; dragStart = { x: e.clientX, y: e.clientY }; }`;

content = content.replace(oldStartDrag, newStartDrag);

// 4. Fix pan canvas - update transform.x and transform.y during mouse move
const oldMouseMove = `function onMouseMove(e) {
    if (!dragNode) return;
    var dx = (e.clientX - dragStart.x) / transform.k;
    var dy = (e.clientY - dragStart.y) / transform.k;
    dragNode.x += dx; dragNode.y += dy;
    dragNode.vx = 0; dragNode.vy = 0;
    dragStart = { x: e.clientX, y: e.clientY };
  }`;
const newMouseMove = `function onMouseMove(e) {
    if (dragNode) {
      var dx = (e.clientX - dragStart.x) / transform.k;
      var dy = (e.clientY - dragStart.y) / transform.k;
      dragNode.x += dx; dragNode.y += dy;
      dragNode.vx = 0; dragNode.vy = 0;
      dragStart = { x: e.clientX, y: e.clientY };
    } else if (isPanning) {
      transform.x = e.clientX - panStart.x;
      transform.y = e.clientY - panStart.y;
      if (g) g.setAttribute("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
    }
  }`;

content = content.replace(oldMouseMove, newMouseMove);

// 5. Add isPanning variable and fix onSvgMouseDown
const oldVars = `var editMode = null; // 'add-link' | 'delete-link' | null`;
const newVars = `var editMode = null; // 'add-link' | 'delete-link' | null
  var isPanning = false;
  var panStart = { x: 0, y: 0 };`;

content = content.replace(oldVars, newVars);

// 6. Fix onSvgMouseDown to handle panning
const oldSvgMouseDown = `function onSvgMouseDown(e) {
    if (e.target === svg) {
      dragNode = null;
      dragStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }`;
const newSvgMouseDown = `function onSvgMouseDown(e) {
    if (e.target === svg) {
      dragNode = null;
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }`;

content = content.replace(oldSvgMouseDown, newSvgMouseDown);

// 7. Fix onMouseUp to stop panning
const oldMouseUp = `function onMouseUp() { dragNode = null; }`;
const newMouseUp = `function onMouseUp() { dragNode = null; isPanning = false; }`;

content = content.replace(oldMouseUp, newMouseUp);

// 8. Remove node position constraints in startSimulation
const oldConstraints = `node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));`;
const newConstraints = `// No position constraints - infinite canvas`;

content = content.replace(oldConstraints, newConstraints);

// 9. Add grid background to SVG
const oldSvgSetup = `svg.innerHTML = "";

    // Create main group`;
const newSvgSetup = `svg.innerHTML = "";

    // Add grid pattern
    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    var pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
    pattern.setAttribute("id", "grid");
    pattern.setAttribute("width", "40");
    pattern.setAttribute("height", "40");
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 40 0 L 0 0 0 40");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#e0e0e0");
    path.setAttribute("stroke-width", "0.5");
    pattern.appendChild(path);
    defs.appendChild(pattern);
    svg.appendChild(defs);

    var gridRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    gridRect.setAttribute("width", "100%");
    gridRect.setAttribute("height", "100%");
    gridRect.setAttribute("fill", "url(#grid)");
    svg.appendChild(gridRect);

    // Create main group`;

content = content.replace(oldSvgSetup, newSvgSetup);

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', content, 'utf8');
console.log('Done');
