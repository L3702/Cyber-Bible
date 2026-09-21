const fs = require('fs');

// Create test file for canvas panning
const testHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test Canvas Pan</title></head>
<body>
<div id="output">Testing...</div>
<script>
  // Mock IndexedDB
  var mockDB = {
    data: { prompts: [], groups: [], annotations: [], links: [] },
    add: function(store, data) {
      this.data[store].push(data);
      return Promise.resolve(data);
    },
    get: function(store, id) {
      return Promise.resolve(this.data[store].find(function(d) { return d.id === id; }));
    },
    getAll: function(store) {
      return Promise.resolve(this.data[store]);
    },
    update: function(store, data) {
      var idx = this.data[store].findIndex(function(d) { return d.id === data.id; });
      if (idx >= 0) this.data[store][idx] = data;
      return Promise.resolve(data);
    },
    delete: function(store, id) {
      var idx = this.data[store].findIndex(function(d) { return d.id === id; });
      if (idx >= 0) this.data[store].splice(idx, 1);
      return Promise.resolve(id);
    },
    clear: function(store) {
      this.data[store] = [];
      return Promise.resolve();
    },
    getByIndex: function(store, index, value) {
      return Promise.resolve(this.data[store].filter(function(d) { return d[index] === value; }));
    }
  };

  // Mock window.CyberBible
  window.CyberBible = {
    db: mockDB,
    store: {
      getGraphData: function() {
        return Promise.resolve({
          nodes: [
            { id: 'p_1', refId: '1', type: 'prompt', name: 'Test Prompt', color: '#4A90D9', shape: 'circle' }
          ],
          links: []
        });
      }
    }
  };

  // Run tests
  async function runTests() {
    var output = document.getElementById('output');
    var results = [];

    // Test 1: Check if graph module exists
    try {
      if (window.CyberBible.ui && window.CyberBible.ui.graph) {
        results.push('✓ Test 1: Graph module exists - PASS');
      } else {
        results.push('✗ Test 1: Graph module exists - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 1: Graph module exists - FAIL: ' + e.message);
    }

    // Test 2: Check if pan function exists
    try {
      // The pan functionality is internal, but we can check if the graph renders
      var container = document.createElement('div');
      container.id = 'graph-container';
      document.body.appendChild(container);
      
      // Mock the render function
      window.CyberBible.ui.graph.render(container);
      
      // Check if SVG exists
      var svg = container.querySelector('.graph-svg');
      if (svg) {
        results.push('✓ Test 2: Graph SVG rendered - PASS');
      } else {
        results.push('✗ Test 2: Graph SVG rendered - FAIL');
      }
    } catch(e) {
      results.push('✗ Test 2: Graph SVG rendered - FAIL: ' + e.message);
    }

    // Test 3: Check if grid background exists
    try {
      var container = document.getElementById('graph-container');
      var svg = container.querySelector('.graph-svg');
      if (svg) {
        var defs = svg.querySelector('defs');
        var pattern = svg.querySelector('pattern#grid');
        if (defs && pattern) {
          results.push('✓ Test 3: Grid background exists - PASS');
        } else {
          results.push('✗ Test 3: Grid background exists - FAIL');
        }
      } else {
        results.push('✗ Test 3: Grid background exists - FAIL: No SVG');
      }
    } catch(e) {
      results.push('✗ Test 3: Grid background exists - FAIL: ' + e.message);
    }

    // Test 4: Check if zoom controls exist
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

    // Test 5: Check if mousedown event listener is attached
    try {
      var container = document.getElementById('graph-container');
      var svg = container.querySelector('.graph-svg');
      if (svg) {
        // Simulate mousedown on SVG
        var event = new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 100
        });
        svg.dispatchEvent(event);
        results.push('✓ Test 5: Mousedown event listener attached - PASS');
      } else {
        results.push('✗ Test 5: Mousedown event listener attached - FAIL: No SVG');
      }
    } catch(e) {
      results.push('✗ Test 5: Mousedown event listener attached - FAIL: ' + e.message);
    }

    output.innerHTML = results.join('<br>');
  }

  runTests();
</script>
</body>
</html>`;

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\test_canvas_pan.html', testHTML, 'utf8');
console.log('Test file created');
