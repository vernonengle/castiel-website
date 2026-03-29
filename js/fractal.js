// Interactive Mandelbrot set renderer
// Click to zoom in, right-click to zoom out, double-click to reset

(function () {
  const canvas = document.getElementById('mandelbrot');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Viewport: x in [xMin, xMax], y in [yMin, yMax]
  let xMin = -2.5, xMax = 1.0, yMin = -1.25, yMax = 1.25;
  const MAX_ITER = 128;
  let rendering = false;
  let currentRender = 0; // cancel stale renders

  // Teal/aqua color palette matching site theme
  function iterToColor(iter) {
    if (iter === MAX_ITER) return [10, 26, 46]; // in-set → deep navy background
    const t = iter / MAX_ITER;
    // Smooth hue cycling through teal → aquamarine → cornflower → deep blue
    const r = Math.round(10  + t * 10  + 80  * Math.sin(Math.PI * t * 3));
    const g = Math.round(26  + t * 190 * Math.sin(Math.PI * t * 2.5 + 0.5));
    const b = Math.round(46  + t * 200 * Math.sin(Math.PI * t * 1.8 + 1.0));
    return [
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b)),
    ];
  }

  function render() {
    const W = canvas.width;
    const H = canvas.height;
    const id = ++currentRender;
    rendering = true;

    const imageData = ctx.createImageData(W, H);
    const data = imageData.data;

    // Render rows in chunks to keep UI responsive
    let y = 0;
    function chunk() {
      if (id !== currentRender) return; // cancelled
      const end = Math.min(y + 8, H);
      for (; y < end; y++) {
        const cy = yMin + (y / H) * (yMax - yMin);
        for (let x = 0; x < W; x++) {
          const cx = xMin + (x / W) * (xMax - xMin);
          let zr = 0, zi = 0, iter = 0;
          while (zr * zr + zi * zi <= 4 && iter < MAX_ITER) {
            const tmp = zr * zr - zi * zi + cx;
            zi = 2 * zr * zi + cy;
            zr = tmp;
            iter++;
          }
          const [r, g, b] = iterToColor(iter);
          const idx = (y * W + x) * 4;
          data[idx]     = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      if (y < H) {
        requestAnimationFrame(chunk);
      } else {
        rendering = false;
        drawOverlay();
      }
    }
    requestAnimationFrame(chunk);
  }

  function drawOverlay() {
    ctx.save();
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(0,188,212,0.7)';
    ctx.fillText('Click to zoom in  |  Right-click to zoom out  |  Double-click to reset', 10, canvas.height - 12);
    ctx.restore();
  }

  function zoom(cx, cy, factor) {
    const dx = (xMax - xMin) * factor * 0.5;
    const dy = (yMax - yMin) * factor * 0.5;
    xMin = cx - dx; xMax = cx + dx;
    yMin = cy - dy; yMax = cy + dy;
    render();
  }

  canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / canvas.offsetWidth;
    const py = (e.clientY - rect.top)  / canvas.offsetHeight;
    const cx = xMin + px * (xMax - xMin);
    const cy = yMin + py * (yMax - yMin);
    zoom(cx, cy, 0.35);
  });

  canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / canvas.offsetWidth;
    const py = (e.clientY - rect.top)  / canvas.offsetHeight;
    const cx = xMin + px * (xMax - xMin);
    const cy = yMin + py * (yMax - yMin);
    zoom(cx, cy, 2.5);
  });

  canvas.addEventListener('dblclick', e => {
    e.preventDefault();
    xMin = -2.5; xMax = 1.0; yMin = -1.25; yMax = 1.25;
    render();
  });

  function setSize() {
    // Square canvas, fill container width up to 600px
    const container = canvas.parentElement;
    const size = Math.min(container.offsetWidth - 32, 600);
    canvas.width  = size;
    canvas.height = size;
    render();
  }

  window.addEventListener('resize', setSize);
  setSize();
})();
