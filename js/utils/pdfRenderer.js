// PDF.js Configuration and Rendering
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

let pdfDoc = null;
let pdfScale = 1.5;

const loadPDF = async (blob) => {
  const container = document.getElementById('pdf-viewer');
  if (!container) return;

  const arrayBuffer = await blob.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  // Render all pages
  container.innerHTML = '';
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
};

window.loadPDF = loadPDF;