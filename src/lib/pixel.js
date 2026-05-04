// Tiny pixel-canvas helpers. All draws are integer-aligned, no AA.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

export function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

// Mirror horizontally a w*h block at (sx,sy) of `from` into `to` at (dx,dy).
export function blitMirrored(from, to, sx, sy, w, h, dx, dy) {
  to.save();
  to.imageSmoothingEnabled = false;
  to.translate(dx + w, dy);
  to.scale(-1, 1);
  to.drawImage(from, sx, sy, w, h, 0, 0, w, h);
  to.restore();
}

export function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
