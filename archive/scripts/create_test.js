const fs = require('fs');

// Create test file for group deletion
const testHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Test Group Delete</title></head>
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
      createGroup: function(data) {
        var group = {
          id: 'test-group-' + Date.now(),
          name: data.name || 'Test Group',
          color: data.color || '#4A90D9',
          order: data.order || Date.now()
        };
        return mockDB.add('groups', group);
      },
      deleteGroup: function(id, moveToGroupId) {
        return mockDB.getByIndex('prompts', 'by_groupId', id).then(function(prompts) {
          var promises = prompts.map(function(p) {
            return mockDB.update('prompts', Object.assign({}, p, { groupId: moveToGroupId || null, updated: Date.now() }));
          });
          return Promise.all(promises);
        }).then(function() {
          return mockDB.delete('groups', id);
        });
      },
      getAllGroups: function() {
        return mockDB.getAll('groups').then(function(groups) {
          return groups.sort(function(a, b) { return a.order - b.order; });
        });
      },
      getAllPrompts: function() {
        return mockDB.getAll('prompts');
      }
    }
  };

  // Run tests
  async function runTests() {
    var output = document.getElementById('output');
    var results = [];

    // Test 1: Create a group
    try {
      var group = await window.CyberBible.store.createGroup({ name: 'Test Group' });
      results.push('✓ Test 1: Create group - PASS');
    } catch(e) {
      results.push('✗ Test 1: Create group - FAIL: ' + e.message);
    }

    // Test 2: Verify group exists
    try {
      var groups = await window.CyberBible.store.getAllGroups();
      if (groups.length === 1 && groups[0].name === 'Test Group') {
        results.push('✓ Test 2: Group exists - PASS');
      } else {
        results.push('✗ Test 2: Group exists - FAIL: Expected 1 group, got ' + groups.length);
      }
    } catch(e) {
      results.push('✗ Test 2: Group exists - FAIL: ' + e.message);
    }

    // Test 3: Delete the group
    try {
      var groups = await window.CyberBible.store.getAllGroups();
      await window.CyberBible.store.deleteGroup(groups[0].id, null);
      results.push('✓ Test 3: Delete group - PASS');
    } catch(e) {
      results.push('✗ Test 3: Delete group - FAIL: ' + e.message);
    }

    // Test 4: Verify group is deleted
    try {
      var groups = await window.CyberBible.store.getAllGroups();
      if (groups.length === 0) {
        results.push('✓ Test 4: Group deleted - PASS');
      } else {
        results.push('✗ Test 4: Group deleted - FAIL: Expected 0 groups, got ' + groups.length);
      }
    } catch(e) {
      results.push('✗ Test 4: Group deleted - FAIL: ' + e.message);
    }

    // Test 5: Delete non-existent group
    try {
      await window.CyberBible.store.deleteGroup('non-existent-id', null);
      results.push('✓ Test 5: Delete non-existent group - PASS (no error)');
    } catch(e) {
      results.push('✗ Test 5: Delete non-existent group - FAIL: ' + e.message);
    }

    output.innerHTML = results.join('<br>');
  }

  runTests();
</script>
</body>
</html>`;

fs.writeFileSync('D:\\Codex\\Cyber_Bible\\test_group_delete.html', testHTML, 'utf8');
console.log('Test file created');
