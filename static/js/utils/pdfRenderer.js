// PDF.js Configuration and Rendering
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let pdfDoc = null;
let pdfScale = 1.5;
let pdfScrollPosition = { top: 0, left: 0 };
let toolbarHideTimeout = null;

// Setup toolbar auto-hide on PDF viewer
const setupToolbarAutoHide = () => {
  const pdfViewer = document.getElementById('pdf-viewer');
  const toolbar = pdfViewer?.querySelector('.pdf-zoom-toolbar');
  
  if (!pdfViewer || !toolbar) return;
  
  const showToolbar = () => {
    toolbar.classList.add('visible');
    
    // Clear existing timeout
    if (toolbarHideTimeout) {
      clearTimeout(toolbarHideTimeout);
    }
    
    // Hide after 2 seconds of inactivity
    toolbarHideTimeout = setTimeout(() => {
      toolbar.classList.remove('visible');
    }, 2000);
  };
  
  // Show toolbar on mouse move in PDF viewer
  pdfViewer.addEventListener('mousemove', showToolbar);
  
  // Keep toolbar visible when hovering over it
  toolbar.addEventListener('mouseenter', () => {
    if (toolbarHideTimeout) {
      clearTimeout(toolbarHideTimeout);
    }
    toolbar.classList.add('visible');
  });
  
  // Start hide timer when leaving toolbar
  toolbar.addEventListener('mouseleave', () => {
    toolbarHideTimeout = setTimeout(() => {
      toolbar.classList.remove('visible');
    }, 2000);
  });
};

// Call setup when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupToolbarAutoHide);
} else {
  setupToolbarAutoHide();
}

const renderAllPages = async () => {
  const container = document.getElementById('pdf-viewer');
  const placeholder = document.getElementById('pdf-placeholder');
  if (!container || !pdfDoc) return;

  // Remove only canvas elements, preserve the toolbar
  const canvases = container.querySelectorAll('.pdf-canvas-page');
  canvases.forEach(canvas => canvas.remove());
  
  const pixelRatio = window.devicePixelRatio || 1;
  
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: pdfScale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = viewport.width * pixelRatio;
    canvas.height = viewport.height * pixelRatio;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    canvas.className = 'pdf-canvas-page';
    
    ctx.scale(pixelRatio, pixelRatio);
    container.appendChild(canvas);
    
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  // Show container, hide placeholder
  if (placeholder) placeholder.style.display = 'none';
  container.classList.add('loaded');

  // Restore scroll position
  setTimeout(() => {
    if (pdfScrollPosition) {
      container.scrollTop = pdfScrollPosition.top;
      container.scrollLeft = pdfScrollPosition.left;
    }
  }, 100);
};

const loadPDF = async (blob) => {
  const container = document.getElementById('pdf-viewer');
  if (!container) return;

  // Save current scroll position
  if (pdfDoc) {
    pdfScrollPosition = {
      top: container.scrollTop,
      left: container.scrollLeft
    };
  }

  const arrayBuffer = await blob.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  await renderAllPages();
  updateZoomDisplay();

  // Setup toolbar auto-hide after PDF is loaded
  setTimeout(setupToolbarAutoHide, 100);
};

const updateZoomDisplay = () => {
  const zoomDisplay = document.getElementById('zoom-level');
  if (zoomDisplay) {
    zoomDisplay.textContent = Math.round(pdfScale * 100) + '%';
  }
};

const zoomIn = async () => {
  if (!pdfDoc) return;
  pdfScale = Math.min(pdfScale + 0.25, 3.0);
  await renderAllPages();
  updateZoomDisplay();
};

const zoomOut = async () => {
  if (!pdfDoc) return;
  pdfScale = Math.max(pdfScale - 0.25, 0.5);
  await renderAllPages();
  updateZoomDisplay();
};

const zoomReset = async () => {
  if (!pdfDoc) return;
  pdfScale = 1.5;
  await renderAllPages();
  updateZoomDisplay();
};

window.loadPDF = loadPDF;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.zoomReset = zoomReset;