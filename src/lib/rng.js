// Mulberry32 — fast, deterministic 32-bit PRNG.
export function makeRng(seed) {
  let s = (seed | 0) || 1;
  const fn = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  fn.int = (max) => Math.floor(fn() * max);
  fn.range = (min, max) => min + Math.floor(fn() * (max - min + 1));
  fn.pick = (arr) => arr[Math.floor(fn() * arr.length)];
  fn.bool = (p = 0.5) => fn() < p;
  return fn;
}

// FNV-1a string hash → 32-bit seed (so users can type any seed string).
export function hashSeed(str) {
  let h = 0x811c9dc5;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function randomSeedString() {
  return Math.floor(Math.random() * 0xffffffff).toString(36);
}
