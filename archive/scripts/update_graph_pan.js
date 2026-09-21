const fs = require('fs');
let content = fs.readFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', 'utf8');

// Fix onSvgMouseDown to handle clicks on grid background and other empty areas
const oldOnSvgMouseDown = `function onSvgMouseDown(e) {
    if (e.target === svg) {
      dragNode = null;
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }`;

const newOnSvgMouseDown = `function onSvgMouseDown(e) {
    // Allow panning when clicking on empty areas (svg, grid rect, or background)
    var isEmptyArea = e.target === svg || e.target.tagName === 'rect' || e.target.classList.contains('graph-container');
    if (isEmptyArea) {
      dragNode = null;
      isPanning = true;
      panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }`;

content = content.replace(oldOnSvgMouseDown, newOnSvgMouseDown);

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\js\\ui\\graph.js', content, 'utf8');
console.log('Done');
