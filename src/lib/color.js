// HSL <-> RGB helpers. All inputs/outputs are 0..255 / 0..360 / 0..100.
export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

export function rgbToHex([r, g, b]) {
  const h = (n) => n.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Build a 4-stop ramp [shadow, mid, light, hilight] for pixel-art shading.
export function buildRamp(h, s, l) {
  return [
    rgbToHex(hslToRgb(h - 4, Math.min(100, s + 6), Math.max(6, l - 26))),
    rgbToHex(hslToRgb(h, s, Math.max(10, l - 10))),
    rgbToHex(hslToRgb(h, s, l)),
    rgbToHex(hslToRgb(h + 6, Math.max(0, s - 12), Math.min(96, l + 16))),
  ];
}

// Hash → integer in [0, n)
export function pickIndex(rng, n) {
  return Math.floor(rng() * n);
}
