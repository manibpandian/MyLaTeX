// Splitter dragging functionality
const initializeSplitters = () => {
  // Horizontal splitter (between sidebar and main content)
  const splitter = document.getElementById('splitter');
  const sidebar = document.querySelector('.sidebar');
  let isDragging = false;

  if (splitter && sidebar) {
    const dragOverlay = document.createElement('div');
    dragOverlay.style.cssText = `
      display: none;
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      cursor: col-resize;
    `;
    document.body.appendChild(dragOverlay);

    splitter.addEventListener('mousedown', function(e) {
      // Only allow dragging if sidebar is open
      if (!sidebar.classList.contains('sidebar-open')) return;
      
      isDragging = true;
      dragOverlay.style.display = 'block';
      splitter.classList.add('active');
      e.preventDefault();
    });

    dragOverlay.addEventListener('mousemove', function(e) {
      if (!isDragging) return;

      const windowWidth = window.innerWidth;
      let newWidth = (e.clientX / windowWidth) * 100;
      
      // Clamp between 15% and 85%
      newWidth = Math.max(15, Math.min(85, newWidth));
      
      sidebar.style.width = newWidth + 'vw';
    });

    const stopDragging = () => {
      if (isDragging) {
        isDragging = false;
        dragOverlay.style.display = 'none';
        splitter.classList.remove('active');
      }
    };

    dragOverlay.addEventListener('mouseup', stopDragging);
    dragOverlay.addEventListener('mouseleave', stopDragging);
  }

  // Vertical splitter (between left and right panes)
  const verticalSplitter = document.getElementById('vertical-splitter');
  const leftPane = document.querySelector('.left-pane');
  const rightPane = document.querySelector('.right-pane');
  let isVerticalDragging = false;

  if (verticalSplitter && leftPane && rightPane) {
    const verticalDragOverlay = document.createElement('div');
    verticalDragOverlay.style.cssText = `
      display: none;
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      cursor: col-resize;
    `;
    document.body.appendChild(verticalDragOverlay);

    verticalSplitter.addEventListener('mousedown', function(e) {
      isVerticalDragging = true;
      verticalDragOverlay.style.display = 'block';
      verticalSplitter.classList.add('active');
      e.preventDefault();
    });

    verticalDragOverlay.addEventListener('mousemove', function(e) {
      if (!isVerticalDragging) return;

      const mainContent = document.querySelector('.main-content');
      const rect = mainContent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      
      // Clamp between 20% and 80%
      const clampedPercentage = Math.max(20, Math.min(80, percentage));
      
      leftPane.style.width = clampedPercentage + '%';
      rightPane.style.flex = 'none';
      rightPane.style.width = (100 - clampedPercentage) + '%';
    });

    const stopVerticalDragging = () => {
      if (isVerticalDragging) {
        isVerticalDragging = false;
        verticalDragOverlay.style.display = 'none';
        verticalSplitter.classList.remove('active');
      }
    };

    verticalDragOverlay.addEventListener('mouseup', stopVerticalDragging);
    verticalDragOverlay.addEventListener('mouseleave', stopVerticalDragging);
  }
};

// Initialize splitters when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSplitters);
} else {
  initializeSplitters();
}

// Also reinitialize when React renders (after a short delay)
setTimeout(initializeSplitters, 500);
