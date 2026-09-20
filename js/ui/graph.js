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

  function render(container) {
    container.innerHTML = '<div class="section-title">🕸️ 关系图谱</div>' +
      '<div class="graph-container">' +
      '<svg class="graph-svg"></svg>' +
      '<div class="graph-legend"><div>● 提示词</div><div>■ 分组</div><div>◆ 标签</div></div>' +
      '<div id="graph-detail" style="position:absolute;top:12px;right:12px;width:250px;background:rgba(255,255,255,0.95);border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);display:none"></div>' +
      '</div>';
    loadAndRender(container);
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
        onNodeClick(container, node);
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