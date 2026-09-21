// Cyber Bible - 关系图谱模块 (Vanilla JS)
(function() {
  var nodes = [];
  var links = [];
  var svg = null;
  var g = null;
  var width = 0;
  var height = 0;
  var transform = { x: 0, y: 0, k: 1 };
  var dragNode = null;
  var dragStart = { x: 0, y: 0 };
  var animFrame = null;
  var editMode = null; // 'add-link' | 'delete-link' | null
  var addLinkSource = null; // first node selected for adding link
  var toolbar = null;

  function render(container) {
    container.innerHTML = '<div class="section-title">🕸️ 关系图谱</div>' +
      '<div id="graph-toolbar" style="display:flex;gap:8px;margin-bottom:8px;padding:8px;background:var(--color-surface);border-radius:8px;box-shadow:var(--shadow-sm)">' +
      '<button id="btn-add-link" class="btn btn-sm btn-secondary">🔗 添加关系</button>' +
      '<button id="btn-delete-link" class="btn btn-sm btn-secondary">✂️ 删除关系</button>' +
      '<button id="btn-cancel-edit" class="btn btn-sm btn-secondary" style="display:none">取消</button>' +
      '<span id="edit-mode-hint" style="font-size:12px;color:#999;margin-left:8px"></span>' +
      '</div>' +
      '<div class="graph-container">' +
      '<svg class="graph-svg"></svg>' +
      '<div class="graph-legend"><div>● 提示词</div><div>■ 分组</div><div>◆ 标签</div></div>' +
      '<div id="graph-detail" style="position:absolute;top:12px;right:12px;width:250px;background:rgba(255,255,255,0.95);border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:none"></div>' +
      '</div>';
    
    // Bind toolbar events
    var addLinkBtn = container.querySelector('#btn-add-link');
    var deleteLinkBtn = container.querySelector('#btn-delete-link');
    var cancelBtn = container.querySelector('#btn-cancel-edit');
    var hint = container.querySelector('#edit-mode-hint');
    
    if (addLinkBtn) addLinkBtn.addEventListener('click', function() {
      if (editMode === 'add-link') {
        cancelEditMode();
      } else {
        editMode = 'add-link';
        addLinkSource = null;
        hint.textContent = '点击第一个节点';
        addLinkBtn.classList.add('btn-primary');
        addLinkBtn.classList.remove('btn-secondary');
        cancelBtn.style.display = '';
      }
    });
    
    if (deleteLinkBtn) deleteLinkBtn.addEventListener('click', function() {
      if (editMode === 'delete-link') {
        cancelEditMode();
      } else {
        editMode = 'delete-link';
        hint.textContent = '点击要删除的关系线';
        deleteLinkBtn.classList.add('btn-danger');
        deleteLinkBtn.classList.remove('btn-secondary');
        cancelBtn.style.display = '';
      }
    });
    
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEditMode);
    
    loadAndRender(container);
  }
  
  function handleAddLinkNodeClick(container, node) {
    var hint = document.querySelector('#edit-mode-hint');
    if (!addLinkSource) {
      addLinkSource = node;
      hint.textContent = '点击第二个节点完成连接';
      // Highlight the source node
      var sourceEl = nodesGroup.querySelector('[data-id="' + node.id + '"]');
      if (sourceEl) sourceEl.style.filter = 'brightness(1.3)';
    } else {
      if (addLinkSource.id === node.id) {
        hint.textContent = '不能连接同一个节点，请选择其他节点';
        return;
      }
      // Check if link already exists
      var exists = links.some(function(l) {
        var s = typeof l.source === 'object' ? l.source.id : l.source;
        var t = typeof l.target === 'object' ? l.target.id : l.target;
        return (s === addLinkSource.id && t === node.id) || (s === node.id && t === addLinkSource.id);
      });
      if (exists) {
        hint.textContent = '这两个节点之间已存在关系';
        // Reset
        var sourceEl = nodesGroup.querySelector('[data-id="' + addLinkSource.id + '"]');
        if (sourceEl) sourceEl.style.filter = '';
        addLinkSource = null;
        hint.textContent = '点击第一个节点';
        return;
      }
      // Create new link
      var newLink = { source: addLinkSource.id, target: node.id, type: 'custom' };
      links.push(newLink);
      // Add to store
      window.CyberBible.store.createLink(addLinkSource.id, node.id).then(function() {
        // Redraw
        renderGraph(container);
        cancelEditMode();
        components.showToast('关系已添加', 'success');
      }).catch(function(e) {
        components.showToast('添加关系失败: ' + e.message, 'error');
      });
    }
  }
  
  function handleDeleteLinkClick(container, link) {
    var s = typeof link.source === 'object' ? link.source.id : link.source;
    var t = typeof link.target === 'object' ? link.target.id : link.target;
    window.CyberBible.store.deleteLink(s, t).then(function() {
      // Remove from local array
      links = links.filter(function(l) {
        var ls = typeof l.source === 'object' ? l.source.id : l.source;
        var lt = typeof l.target === 'object' ? l.target.id : l.target;
        return !(ls === s && lt === t);
      });
      renderGraph(container);
      cancelEditMode();
      components.showToast('关系已删除', 'success');
    }).catch(function(e) {
      components.showToast('删除关系失败: ' + e.message, 'error');
    });
  }
  
  function cancelEditMode() {
    editMode = null;
    addLinkSource = null;
    var addLinkBtn = document.querySelector('#btn-add-link');
    var deleteLinkBtn = document.querySelector('#btn-delete-link');
    var cancelBtn = document.querySelector('#btn-cancel-edit');
    var hint = document.querySelector('#edit-mode-hint');
    if (addLinkBtn) { addLinkBtn.classList.remove('btn-primary'); addLinkBtn.classList.add('btn-secondary'); }
    if (deleteLinkBtn) { deleteLinkBtn.classList.remove('btn-danger'); deleteLinkBtn.classList.add('btn-secondary'); }
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (hint) hint.textContent = '';
  }

  async function loadAndRender(container) {
    try {
      var data = await window.CyberBible.store.getGraphData();
      nodes = data.nodes;
      links = data.links;
      renderGraph(container);
    } catch(e) {
      console.error("Graph error:", e);
      var gc = container.querySelector(".graph-container");
      if (gc) gc.innerHTML = '<div class="empty-state">图谱加载失败: ' + e.message + '</div>';
    }
  }

  function renderGraph(container) {
    var graphContainer = container.querySelector(".graph-container");
    svg = container.querySelector(".graph-svg");
    if (!svg || !graphContainer) { console.error("SVG not found"); return; }
    width = graphContainer.clientWidth || 600;
    height = graphContainer.clientHeight || 400;
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.innerHTML = "";

    // Create main group
    g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(g);

    // Links group
    var linksGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    linksGroup.setAttribute("id", "links-group");
    g.appendChild(linksGroup);

    // Nodes group
    var nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodesGroup.setAttribute("id", "nodes-group");
    g.appendChild(nodesGroup);

    // Draw links
    links.forEach(function(link) {
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("stroke", "#ccc");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-opacity", "0.6");
      line.setAttribute("data-source", typeof link.source === "object" ? link.source.id : link.source);
      line.setAttribute("data-target", typeof link.target === "object" ? link.target.id : link.target);
      linksGroup.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(function(node) {
      var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("data-id", node.id);
      group.setAttribute("data-type", node.type);
      group.style.cursor = "pointer";

      var shape;
      if (node.shape === "rect") {
        shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        shape.setAttribute("x", "-16"); shape.setAttribute("y", "-12");
        shape.setAttribute("width", "32"); shape.setAttribute("height", "24");
        shape.setAttribute("rx", "4");
      } else if (node.shape === "diamond") {
        shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
        shape.setAttribute("d", "M0,-18 L15,0 L0,18 L-15,0 Z");
      } else {
        shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        shape.setAttribute("r", "18");
      }
      shape.setAttribute("fill", node.color);
      shape.setAttribute("stroke", "#fff");
      shape.setAttribute("stroke-width", "2");
      group.appendChild(shape);

      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dy", node.shape === "rect" ? "4" : "30");
      label.setAttribute("font-size", "11");
      label.setAttribute("fill", "#333");
      label.textContent = node.name.length > 8 ? node.name.substring(0, 8) + "..." : node.name;
      group.appendChild(label);

      group.addEventListener("click", function(e) {
        e.stopPropagation();
        if (editMode === 'add-link') {
          handleAddLinkNodeClick(container, node);
        } else if (editMode === 'delete-link') {
          // In delete-link mode, clicking nodes does nothing special
        } else {
          onNodeClick(container, node);
        }
      });
      group.addEventListener("dblclick", function(e) {
        e.stopPropagation();
        if (node.type === "prompt" && window.CyberBible.ui.promptDetail) {
          window.CyberBible.ui.promptDetail.openView(node.refId);
        }
      });
      group.addEventListener("mousedown", function(e) {
        e.stopPropagation();
        startDrag(e, node);
      });

      nodesGroup.appendChild(group);
    });

    // Add link line click handler
    links.forEach(function(link) {
      var line = linksGroup.querySelector('[data-source="' + (typeof link.source === 'object' ? link.source.id : link.source) + '"][data-target="' + (typeof link.target === 'object' ? link.target.id : link.target) + '"]');
      if (line) {
        line.style.cursor = 'pointer';
        line.addEventListener('click', function(e) {
          e.stopPropagation();
          if (editMode === 'delete-link') {
            handleDeleteLinkClick(container, link);
          }
        });
      }
    });

    // SVG events
    svg.addEventListener("wheel", onWheel);
    svg.addEventListener("mousedown", onSvgMouseDown);
    svg.addEventListener("click", function(e) {
      if (e.target === svg) {
        resetHighlight();
        var panel = container.querySelector("#graph-detail");
        if (panel) panel.style.display = "none";
      }
    });
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    initPositions();
    startSimulation();
  }

  function initPositions() {
    var cx = width / 2, cy = height / 2;
    nodes.forEach(function(node) {
      if (!node.x) {
        node.x = cx + (Math.random() - 0.5) * 200;
        node.y = cy + (Math.random() - 0.5) * 200;
      }
      node.vx = 0; node.vy = 0;
    });
  }

  function startSimulation() {
    var alpha = 1, decay = 0.99;
    function tick() {
      if (alpha < 0.005) return;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[j].x - nodes[i].x;
          var dy = nodes[j].y - nodes[i].y;
          var dist = Math.sqrt(dx*dx + dy*dy) || 1;
          var force = 2000 / (dist * dist);
          var fx = (dx / dist) * force, fy = (dy / dist) * force;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }
      links.forEach(function(link) {
        var source = typeof link.source === "object" ? link.source : nodes.find(function(n){ return n.id === link.source; });
        var target = typeof link.target === "object" ? link.target : nodes.find(function(n){ return n.id === link.target; });
        if (!source || !target) return;
        var dx = target.x - source.x, dy = target.y - source.y;
        var dist = Math.sqrt(dx*dx + dy*dy) || 1;
        var force = (dist - 80) * 0.01;
        var fx = (dx / dist) * force, fy = (dy / dist) * force;
        source.vx += fx; source.vy += fy;
        target.vx -= fx; target.vy -= fy;
      });
      var cx = width/2, cy = height/2;
      nodes.forEach(function(node) {
        if (node === dragNode) return;
        node.vx += (cx - node.x) * 0.001;
        node.vy += (cy - node.y) * 0.001;
        node.vx *= 0.6; node.vy *= 0.6;
        node.x += node.vx; node.y += node.vy;
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });
      updatePositions();
      alpha *= decay;
      animFrame = requestAnimationFrame(tick);
    }
    tick();
  }

  function updatePositions() {
    if (!g) return;
    var nodesGroup = g.querySelector("#nodes-group");
    var linksGroup = g.querySelector("#links-group");
    if (!nodesGroup || !linksGroup) return;
    nodes.forEach(function(node) {
      var el = nodesGroup.querySelector("[data-id=\"" + node.id + "\"]");
      if (el) el.setAttribute("transform", "translate(" + node.x.toFixed(1) + "," + node.y.toFixed(1) + ")");
    });
    links.forEach(function(link) {
      var s = typeof link.source === "object" ? link.source.id : link.source;
      var t = typeof link.target === "object" ? link.target.id : link.target;
      var line = linksGroup.querySelector("[data-source=\"" + s + "\"][data-target=\"" + t + "\"]");
      if (line) {
        var source = typeof link.source === "object" ? link.source : nodes.find(function(n){ return n.id === link.source; });
        var target = typeof link.target === "object" ? link.target : nodes.find(function(n){ return n.id === link.target; });
        if (source && target) {
          line.setAttribute("x1", source.x.toFixed(1));
          line.setAttribute("y1", source.y.toFixed(1));
          line.setAttribute("x2", target.x.toFixed(1));
          line.setAttribute("y2", target.y.toFixed(1));
        }
      }
    });
  }

  function onNodeClick(container, node) {
    var connected = new Set();
    connected.add(node.id);
    links.forEach(function(l) {
      var sid = typeof l.source === "object" ? l.source.id : l.source;
      var tid = typeof l.target === "object" ? l.target.id : l.target;
      if (sid === node.id) connected.add(tid);
      if (tid === node.id) connected.add(sid);
    });
    var nodesGroup = g.querySelector("#nodes-group");
    var linksGroup = g.querySelector("#links-group");
    if (nodesGroup) Array.from(nodesGroup.children).forEach(function(el) {
      el.style.opacity = connected.has(el.getAttribute("data-id")) ? "1" : "0.2";
    });
    if (linksGroup) Array.from(linksGroup.children).forEach(function(el) {
      var s = el.getAttribute("data-source"), t = el.getAttribute("data-target");
      el.setAttribute("stroke-opacity", (s === node.id || t === node.id) ? "1" : "0.05");
    });
    var panel = container.querySelector("#graph-detail");
    if (panel) {
      panel.style.display = "block";
      panel.innerHTML = "<div style=\"font-weight:600;margin-bottom:8px\">" + node.name + "</div>" +
        "<div style=\"font-size:12px;color:#666\">" + (node.type === "prompt" ? "提示词" : node.type === "group" ? "分组" : "标签") + "</div>";
    }
  }

  function resetHighlight() {
    if (!g) return;
    var nodesGroup = g.querySelector("#nodes-group");
    var linksGroup = g.querySelector("#links-group");
    if (nodesGroup) Array.from(nodesGroup.children).forEach(function(el) { el.style.opacity = "1"; });
    if (linksGroup) Array.from(linksGroup.children).forEach(function(el) { el.setAttribute("stroke-opacity", "0.6"); });
  }

  function startDrag(e, node) { dragNode = node; dragStart = { x: e.clientX, y: e.clientY }; }

  function onMouseMove(e) {
    if (!dragNode) return;
    var dx = (e.clientX - dragStart.x) / transform.k;
    var dy = (e.clientY - dragStart.y) / transform.k;
    dragNode.x += dx; dragNode.y += dy;
    dragNode.vx = 0; dragNode.vy = 0;
    dragStart = { x: e.clientX, y: e.clientY };
  }

  function onMouseUp() { dragNode = null; }

  function onWheel(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    transform.k = Math.max(0.2, Math.min(4, transform.k * delta));
    if (g) g.setAttribute("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
  }

  function onSvgMouseDown(e) {
    if (e.target === svg) {
      dragNode = null;
      dragStart = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }

  window.CyberBible = window.CyberBible || {};
  window.CyberBible.ui = window.CyberBible.ui || {};
  window.CyberBible.ui.graph = { render: render };
})();