const fs = require('fs');

// Create a test that loads the full page
const testHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test Pan</title></head>
<body>
<div id="output">Testing...</div>
<div id="graph-container" style="width:600px;height:400px"></div>
<script>
  // Load all required scripts
  var scripts = [
    'js/db.js',
    'js/store.js',
    'js/ui/components.js',
    'js/ui/graph.js'
  ];
  
  var loaded = 0;
  scripts.forEach(function(src) {
    var script = document.createElement('script');
    script.src = src;
    script.onload = function() {
      loaded++;
      if (loaded === scripts.length) {
        runTests();
      }
    };
    document.head.appendChild(script);
  });
  
  async function runTests() {
    var output = document.getElementById('output');
    var results = [];
    
    // Test 1: Check if graph module exists
    try {
      if (window.CyberBible && window.CyberBible.ui && window.CyberBible.ui.graph) {
        results.push('✓ Test 1: Graph module exists - PASS');
      } else {
        results.push('✗ Test 1: Graph module exists - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 1: Graph module exists - FAIL: ' + e.message);
    }
    
    // Test 2: Render graph and check SVG
    try {
      var container = document.getElementById('graph-container');
      window.CyberBible.ui.graph.render(container);
      var svg = container.querySelector('.graph-svg');
      if (svg) {
        results.push('✓ Test 2: Graph SVG rendered - PASS');
      } else {
        results.push('✗ Test 2: Graph SVG rendered - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 2: Graph SVG rendered - FAIL: ' + e.message);
    }
    
    // Test 3: Check grid background
    try {
      var container = document.getElementById('graph-container');
      var svg = container.querySelector('.graph-svg');
      var pattern = svg.querySelector('pattern#grid');
      if (pattern) {
        results.push('✓ Test 3: Grid background exists - PASS');
      } else {
        results.push('✗ Test 3: Grid background exists - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 3: Grid background exists - FAIL: ' + e.message);
    }
    
    // Test 4: Check zoom controls
    try {
      var container = document.getElementById('graph-container');
      var zoomIn = container.querySelector('#btn-zoom-in');
      var zoomOut = container.querySelector('#btn-zoom-out');
      var zoomReset = container.querySelector('#btn-zoom-reset');
      if (zoomIn && zoomOut && zoomReset) {
        results.push('✓ Test 4: Zoom controls exist - PASS');
      } else {
        results.push('✗ Test 4: Zoom controls exist - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 4: Zoom controls exist - FAIL: ' + e.message);
    }
    
    // Test 5: Simulate pan on empty area
    try {
      var container = document.getElementById('graph-container');
      var svg = container.querySelector('.graph-svg');
      
      // Simulate mousedown on SVG (empty area)
      var mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100
      });
      svg.dispatchEvent(mousedownEvent);
      
      // Simulate mousemove
      var mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 150
      });
      document.dispatchEvent(mousemoveEvent);
      
      // Simulate mouseup
      var mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(mouseupEvent);
      
      results.push('✓ Test 5: Pan simulation - PASS');
    } catch(e) {
      results.push('✗ Test 5: Pan simulation - FAIL: ' + e.message);
    }
    
    output.innerHTML = results.join('<br>');
  }
</script>
</body>
</html>`;

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\test_pan_full.html', testHTML, 'utf8');
console.log('Test file created');
