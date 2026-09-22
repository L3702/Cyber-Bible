/**
 * Cyber Bible — Visual Enhancements
 * Purely decorative: custom cursor, typewriter, scroll reveal, tag fade.
 * Does NOT modify any app functionality.
 */
(function() {
  'use strict';

  // Use both DOMContentLoaded and a fallback for late initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100); // Small delay to ensure app.js has run
  }

  function init() {
    initCustomCursor();
    initTypewriter();
    initTagRotation();
    initScrollReveal();
    initViewObserver();
    checkInitialHero();
  }

  // ============================================================
  // CUSTOM CURSOR (desktop only)
  // ============================================================
  function initCustomCursor() {
    if (window.matchMedia('(hover: none)').matches) return;
    
    var cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    document.body.classList.add('custom-cursor-active');

    var mouseX = 0, mouseY = 0;
    var cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', function(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener('mousedown', function() {
      cursor.classList.add('clicked');
    });

    document.addEventListener('mouseup', function() {
      cursor.classList.remove('clicked');
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // ============================================================
  // TYPEWRITER EFFECT
  // ============================================================
  function initTypewriter() {
    var heroSection = document.getElementById('hero-section');
    var typewriterEl = document.getElementById('typewriter-text');
    if (!heroSection || !typewriterEl) return;

    var slogans = [
      "Your AI Prompts,\nPerfectly Organized.",
      "Think It. Save It.\nUse It Again."
    ];
    
    var sloganIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var pauseCounter = 0;
    var started = false;

    function typewriterTick() {
      var current = slogans[sloganIndex];
      
      if (!isDeleting) {
        typewriterEl.innerHTML = current.substring(0, charIndex + 1).replace(/\n/g, "<br>");
        charIndex++;
        
        if (charIndex >= current.length) {
          pauseCounter++;
          if (pauseCounter > 60) {
            isDeleting = true;
            pauseCounter = 0;
          }
        }
      } else {
        typewriterEl.innerHTML = current.substring(0, charIndex - 1).replace(/\n/g, "<br>");
        charIndex--;
        
        if (charIndex <= 0) {
          isDeleting = false;
          sloganIndex = (sloganIndex + 1) % slogans.length;
        }
      }
      
      var speed;
      if (pauseCounter > 0 && !isDeleting) speed = 300;
      else if (isDeleting) speed = 30;
      else speed = 50 + Math.random() * 40;
      
      setTimeout(typewriterTick, speed);
    }

    function startTypewriter() {
      if (started) return;
      started = true;
      setTimeout(typewriterTick, 500);
    }

    // Watch for hero becoming visible
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (!heroSection.classList.contains("hidden")) {
          startTypewriter();
        }
      });
    });
    observer.observe(heroSection, { attributes: true, attributeFilter: ["class"] });
    
    // Check immediately
    if (!heroSection.classList.contains("hidden")) {
      startTypewriter();
    }
  }

  // ============================================================
  // TAG FADE IN/OUT
  // ============================================================
  function initTagRotation() {
    var tagEl = document.getElementById("hero-tag");
    if (!tagEl) return;

    var tags = [
      "AI · Prompts · Knowledge",
      "Local-First · Private · Fast",
      "Organize · Search · Connect"
    ];
    var tagIndex = 0;
    var rotating = false;

    function rotateTag() {
      if (document.getElementById("hero-section").classList.contains("hidden")) {
        setTimeout(rotateTag, 1000);
        return;
      }
      
      tagEl.classList.remove("visible");
      
      setTimeout(function() {
        tagIndex = (tagIndex + 1) % tags.length;
        tagEl.textContent = tags[tagIndex];
        tagEl.classList.add("visible");
      }, 600);
      
      setTimeout(rotateTag, 4000);
    }

    function startRotation() {
      if (rotating) return;
      rotating = true;
      setTimeout(function() { tagEl.classList.add("visible"); }, 300);
      setTimeout(rotateTag, 4000);
    }

    // Watch for hero visibility
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (!document.getElementById("hero-section").classList.contains("hidden")) {
          startRotation();
        }
      });
    });
    observer.observe(document.getElementById("hero-section"), { attributes: true, attributeFilter: ["class"] });
    
    // Check immediately
    if (!document.getElementById("hero-section").classList.contains("hidden")) {
      startRotation();
    }
  }

  // ============================================================
  // VIEW OBSERVER — Show/hide hero based on active view
  // ============================================================
  function initViewObserver() {
    var heroSection = document.getElementById("hero-section");
    var spiralDots = document.getElementById("spiral-dots");
    var audioBars = document.getElementById("audio-bars");
    if (!heroSection) return;

    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    var observer = new MutationObserver(function() {
      updateHeroVisibility();
    });

    observer.observe(sidebar, { subtree: true, attributes: true, attributeFilter: ["class"] });
  }

  function checkInitialHero() {
    // Check if home is the initial active view
    setTimeout(updateHeroVisibility, 50);
    setTimeout(updateHeroVisibility, 300);
    setTimeout(updateHeroVisibility, 1000);
  }

  function updateHeroVisibility() {
    var heroSection = document.getElementById("hero-section");
    var spiralDots = document.getElementById("spiral-dots");
    var audioBars = document.getElementById("audio-bars");
    var sidebar = document.getElementById("sidebar");
    if (!heroSection || !sidebar) return;
    
    var activeItem = sidebar.querySelector(".nav-item.active");
    if (activeItem && activeItem.getAttribute("data-view") === "home") {
      heroSection.classList.remove("hidden");
      if (spiralDots) spiralDots.style.opacity = "1";
      if (audioBars) audioBars.style.opacity = "1";
    } else {
      heroSection.classList.add("hidden");
      if (spiralDots) spiralDots.style.opacity = "0";
      if (audioBars) audioBars.style.opacity = "0";
    }
  }

  // ============================================================
  // SCROLL REVEAL ANIMATION
  // ============================================================
  function initScrollReveal() {
    var content = document.getElementById("content");
    if (!content) return;

    var revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });

    var contentObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType !== 1) return;
          
          if (node.classList && node.classList.contains("stat-card")) {
            node.classList.add("reveal");
          }
          if (node.classList && node.classList.contains("prompt-card")) {
            node.classList.add("stagger-child");
          }
          
          if (node.querySelectorAll) {
            var stats = node.querySelectorAll(".stat-card:not(.reveal)");
            stats.forEach(function(el, i) {
              el.classList.add("reveal");
              el.style.transitionDelay = (i * 0.08) + "s";
            });
            
            var cards = node.querySelectorAll(".prompt-card:not(.stagger-child)");
            cards.forEach(function(el, i) {
              el.classList.add("stagger-child");
              el.style.transitionDelay = (i * 0.06) + "s";
            });
            
            var sections = node.querySelectorAll(".section-title:not(.reveal)");
            sections.forEach(function(el) {
              el.classList.add("reveal");
            });
          }
        });
      });
      
      // Observe new reveal elements
      document.querySelectorAll(".reveal:not(.revealed), .stagger-child:not(.revealed)").forEach(function(el) {
        revealObserver.observe(el);
      });
    });

    contentObserver.observe(content, { childList: true, subtree: true });
  }

})();
