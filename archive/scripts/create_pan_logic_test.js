const fs = require('fs');

// Create a simpler test that directly tests the pan logic
const testHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test Pan Logic</title></head>
<body>
<div id="output">Testing...</div>
<script>
  // Test the pan logic directly
  var results = [];
  
  // Test 1: Check if onSvgMouseDown function exists and handles empty areas
  try {
    // Simulate the onSvgMouseDown logic
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    svg.appendChild(rect);
    document.body.appendChild(svg);
    
    var transform = { x: 0, y: 0, k: 1 };
    var isPanning = false;
    var panStart = { x: 0, y: 0 };
    
    // Simulate the onSvgMouseDown logic
    function onSvgMouseDown(e) {
      var isEmptyArea = e.target === svg || e.target.tagName === 'rect' || e.target.classList.contains('graph-container');
      if (isEmptyArea) {
        isPanning = true;
        panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
      }
    }
    
    // Test clicking on SVG
    var event1 = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
    svg.dispatchEvent(event1);
    
    if (isPanning) {
      results.push('✓ Test 1: Pan on SVG click - PASS');
    } else {
      results.push('✗ Test 1: Pan on SVG click - FAIL');
    }
    
    // Reset
    isPanning = false;
    
    // Test clicking on rect (grid background)
    var event2 = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
    rect.dispatchEvent(event2);
    
    if (isPanning) {
      results.push('✓ Test 2: Pan on rect click - PASS');
    } else {
      results.push('✗ Test 2: Pan on rect click - FAIL');
    }
    
    // Test 3: Check if panStart is calculated correctly
    if (panStart.x === 100 && panStart.y === 100) {
      results.push('✓ Test 3: Pan start calculation - PASS');
    } else {
      results.push('✗ Test 3: Pan start calculation - FAIL: Expected (100, 100), got (' + panStart.x + ', ' + panStart.y + ')');
    }
    
  } catch(e) {
    results.push('✗ Test: ' + e.message);
  }
  
  document.getElementById('output').innerHTML = results.join('<br>');
</script>
</body>
</html>`;

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\test_pan_logic.html', testHTML, 'utf8');
console.log('Test file created');
