// Active Element Overlay System
class ActiveElementOverlay {
  constructor() {
    this.overlay = null;
    this.activeElement = null;
    this.init();
  }

  init() {
    // Create overlay element
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      border: 2px solid #ff0080;
      background: rgba(255, 0, 128, 0.1);
      box-sizing: border-box;
      display: none;
    `;
    document.body.appendChild(this.overlay);

    // Add resize listener
    window.addEventListener('resize', () => {
      this.refresh();
    });
  }

  findActiveElement() {
    // Look for element with data-active-ptr attribute
    const activeElement = document.querySelector('[data-active-ptr="true"]');
    return activeElement;
  }

  updateOverlay() {
    const activeElement = this.findActiveElement();

    if (activeElement && activeElement !== this.activeElement) {
      this.activeElement = activeElement;
      this.showOverlay();
    } else if (!activeElement && this.activeElement) {
      this.hideOverlay();
      this.activeElement = null;
    } else if (activeElement && activeElement === this.activeElement) {
      this.refresh();
    }
  }

  showOverlay() {
    if (!this.activeElement) return;

    const rect = this.activeElement.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    this.overlay.style.display = 'block';
    this.overlay.style.left = (rect.left + scrollX) + 'px';
    this.overlay.style.top = (rect.top + scrollY) + 'px';
    this.overlay.style.width = rect.width + 'px';
    this.overlay.style.height = rect.height + 'px';
  }

  hideOverlay() {
    this.overlay.style.display = 'none';
  }

  refresh() {
    if (this.activeElement) {
      this.showOverlay();
    }
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}

// Smart Tooltip System
class SmartTooltip {
  constructor() {
    this.tooltip = document.getElementById('smart-tooltip');
    this.content = document.getElementById('tooltip-content');
    this.currentTarget = null;
    this.hideTimeout = null;
    this.showTimeout = null;

    // Validate required elements exist
    if (!this.tooltip || !this.content) {
      console.error('SmartTooltip: Required elements not found');
      return;
    }
  }

  show(element, content) {
    // Clear any pending timeouts
    this.clearTimeouts();

    // Validate element is still in DOM
    if (!element || !document.contains(element)) {
      return;
    }

    // Delay showing the tooltip slightly to avoid flickering
    this.showTimeout = setTimeout(() => {
      // Double-check element is still valid and in DOM
      if (!element || !document.contains(element)) {
        return;
      }

      this.currentTarget = element;
      this.content.innerHTML = content;
      this.tooltip.style.display = 'block';

      // Position the tooltip optimally
      this.positionOptimally(element);

      // Add visible class for transition
      requestAnimationFrame(() => {
        this.tooltip.classList.add('visible');
      });
    }, 50);
  }

  hide() {
    // Clear any pending timeouts
    this.clearTimeouts();

    this.hideTimeout = setTimeout(() => {
      this.tooltip.classList.remove('visible');
      this.currentTarget = null;

      // Hide the tooltip completely after transition
      setTimeout(() => {
        if (!this.tooltip.classList.contains('visible')) {
          this.tooltip.style.display = 'none';
        }
      }, 150); // Match CSS transition duration
    }, 100);
  }

  clearTimeouts() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  positionOptimally(targetElement) {
    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Clear all arrow classes
    this.tooltip.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left', 'arrow-right');

    let left, top, arrowClass;

    // Try positioning below the target first (preferred)
    if (targetRect.bottom + tooltipRect.height + 10 <= viewportHeight) {
      top = targetRect.bottom + scrollY + 10;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
      arrowClass = 'arrow-top';
    }
    // Try positioning above the target
    else if (targetRect.top - tooltipRect.height - 10 >= 0) {
      top = targetRect.top + scrollY - tooltipRect.height - 10;
      left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
      arrowClass = 'arrow-bottom';
    }
    // Try positioning to the right
    else if (targetRect.right + tooltipRect.width + 10 <= viewportWidth) {
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.right + scrollX + 10;
      arrowClass = 'arrow-left';
    }
    // Position to the left as last resort
    else {
      top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.left + scrollX - tooltipRect.width - 10;
      arrowClass = 'arrow-right';
    }

    // Ensure tooltip stays within viewport bounds
    left = Math.max(10, Math.min(left, viewportWidth - tooltipRect.width - 10));
    top = Math.max(10, Math.min(top, viewportHeight - tooltipRect.height - 10));

    // Apply position and arrow
    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
    this.tooltip.classList.add(arrowClass);
  }

  formatNodeAttributes(element) {
    const nodeName = element.getAttribute('data-node-name') || 'Unknown';
    const attributesJson = element.getAttribute('data-node-attributes') || '{}';

    let html = '<strong>' + nodeName + '</strong>';

    try {
      const attrs = JSON.parse(attributesJson);
      const sortedKeys = Object.keys(attrs).sort();

      for (const key of sortedKeys) {
        const value = attrs[key];
        // Truncate very long values for better display
        let displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        html += '<br/><span style="color: #90EE90;">' + key + '</span>="<span style="color: #FFE4B5;">' + displayValue + '</span>"';
      }
    } catch (e) {
      html += '<br/><em>Error parsing attributes</em>';
    }

    return html;
  }
}

// Initialize tooltip system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const smartTooltip = new SmartTooltip();
  const activeOverlay = new ActiveElementOverlay();

  // Early return if tooltip initialization failed
  if (!smartTooltip.tooltip) {
    return;
  }

  const rootContainer = document.querySelector('.root');
  const overflowToggle = document.getElementById('overflow-toggle');

  // Initialize overflow state based on checkbox
  function updateOverflowState() {
    if (overflowToggle && rootContainer) {
      if (overflowToggle.checked) {
        rootContainer.classList.remove('overflow-visible');
      } else {
        rootContainer.classList.add('overflow-visible');
      }
    }
  }

  // Set initial state
  updateOverflowState();

  // Set up mutation observer to watch for active element changes
  const observer = new MutationObserver(() => {
    activeOverlay.updateOverlay();
  });

  // Start observing the root container for class changes
  if (rootContainer) {
    observer.observe(rootContainer, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });
  }

  // Initial overlay update
  activeOverlay.updateOverlay();

  // Add overflow toggle event listener
  if (overflowToggle) {
    overflowToggle.addEventListener('change', updateOverflowState);
  }

  // Add click outside handler to toggle overflow back to hidden
  document.addEventListener('click', function(e) {
    if (rootContainer && overflowToggle) {
      const rootRect = rootContainer.getBoundingClientRect();
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Check if click is outside the root container bounds
      const isOutside = (
        clickX < rootRect.left ||
        clickX > rootRect.right ||
        clickY < rootRect.top ||
        clickY > rootRect.bottom
      );

      // Check if target is body, root, or something inside root
      const isTargetValid = (
        e.target === document.body ||
        e.target === rootContainer ||
        rootContainer.contains(e.target)
      );

      if (isOutside && isTargetValid && !overflowToggle.checked) {
        overflowToggle.checked = true;
        updateOverflowState();
      }
    }
  });

  // Hide tooltip when leaving the root container
  if (rootContainer) {
    rootContainer.addEventListener('mouseleave', () => {
      smartTooltip.hide();
    });
  }

  // Add mouse event handlers to all nodes
  const nodes = document.querySelectorAll('.node');
  nodes.forEach(function(node, index) {
    // Mouse enter - show tooltip
    node.addEventListener('mouseenter', function(e) {
      // Stop event propagation to prevent conflicts
      e.stopPropagation();
      const content = smartTooltip.formatNodeAttributes(this);
      smartTooltip.show(this, content);
    });

    // Mouse leave - hide tooltip
    node.addEventListener('mouseleave', function(e) {
      // Stop event propagation to prevent conflicts
      e.stopPropagation();
      smartTooltip.hide();
    });

    // Click handler for debugging
    node.addEventListener('click', function(e) {
      e.stopPropagation();
      const nodeName = this.getAttribute('data-node-name');
      const nodeAttrs = this.getAttribute('data-node-attributes');
      console.log('Node: ' + nodeName, JSON.parse(nodeAttrs || '{}'));
    });
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    smartTooltip.clearTimeouts();
    observer.disconnect();
    activeOverlay.destroy();
  });
});
