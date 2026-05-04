// RPG Maker MV face sheet.
//   4 columns x 2 rows of 96x96 portraits  =>  384 x 192 sheet.
//
// Each portrait is composed at 1:1 (96px is plenty for a stylized bust).

import { makeCanvas, rect } from '../lib/pixel.js';
import { DB } from '../data/db.js';
import { makeRng, hashSeed } from '../lib/rng.js';

const FACE_W = 96;
const FACE_H = 96;
export const FACE_COLS = 4;
export const FACE_ROWS = 2;
export const FACE_SHEET_W = FACE_W * FACE_COLS; // 384
export const FACE_SHEET_H = FACE_H * FACE_ROWS; // 192

export function resolveFaceParams(seedString, overrides = {}) {
  const rng = makeRng(hashSeed(seedString));
  return {
    seed: seedString,
    skin: overrides.skin ?? rng.pick(DB.skins),
    hair: overrides.hair ?? rng.pick(DB.hairs),
    armor: overrides.armor ?? rng.pick(DB.armors),
    accessory: overrides.accessory ?? rng.pick(DB.accessories),
    eye: overrides.eye ?? rng.pick(DB.eyes),
    shape: overrides.shape ?? rng.pick(DB.faceShapes),
    expression: overrides.expression ?? rng.pick(DB.expressions),
  };
}

// Anatomy for a single 96x96 face cell. Design is a centered bust:
//   head:    x=22..73, y=12..71 (52 wide, 60 tall, slightly tall-oval)
//   neck:    x=40..55, y=72..82
//   shoulders/clothes: x=8..87, y=80..95
function drawFaceInto(ctx, ox, oy, p, expressionOverride) {
  const skin = p.skin.ramp;
  const armor = p.armor.ramp;
  const hair = p.hair.ramp;
  const eye = p.eye.ramp;
  const acc = p.accessory.ramp;
  const accKind = p.accessory.kind;
  const exp = expressionOverride || p.expression;

  // Background tile (subtle, for cell separation while still being transparent on export)
  // Skipping background to keep PNG transparent — RPG Maker MV expects transparent faces.

  // Shoulders & garment
  rect(ctx, ox + 6,  oy + 78, 84, 18, armor[1]);
  rect(ctx, ox + 6,  oy + 78, 84, 2,  armor[2]);
  rect(ctx, ox + 6,  oy + 94, 84, 2,  armor[0]);
  rect(ctx, ox + 36, oy + 80, 24, 6,  armor[2]); // collar
  rect(ctx, ox + 38, oy + 86, 20, 2,  armor[0]); // collar shadow
  // armor accent stripe
  rect(ctx, ox + 12, oy + 88, 72, 1, armor[3]);

  // Neck
  rect(ctx, ox + 40, oy + 70, 16, 10, skin[0]);
  rect(ctx, ox + 41, oy + 70, 14, 9,  skin[1]);
  rect(ctx, ox + 42, oy + 70, 12, 1,  skin[2]); // chin shadow under jaw

  // Head shape
  drawHeadShape(ctx, ox, oy, p.shape, skin);

  // Face shading (cheek light/right, jaw shadow/left)
  rect(ctx, ox + 65, oy + 30, 4, 22, skin[2]);   // right cheek light
  rect(ctx, ox + 27, oy + 30, 4, 22, skin[0]);   // left jaw shadow
  rect(ctx, ox + 30, oy + 64, 36, 4, skin[0]);   // chin shadow

  // Brows
  drawBrows(ctx, ox, oy, exp, hair);

  // Eyes
  drawEyes(ctx, ox, oy, exp, skin, eye);

  // Nose
  rect(ctx, ox + 47, oy + 44, 2, 8, skin[0]);
  rect(ctx, ox + 46, oy + 50, 4, 2, skin[0]);
  rect(ctx, ox + 47, oy + 49, 2, 1, skin[2]);

  // Mouth
  drawMouth(ctx, ox, oy, exp, skin);

  // Hair (front)
  drawHairFace(ctx, ox, oy, p.hair.style, hair, p.shape);

  // Accessory
  drawAccessoryFace(ctx, ox, oy, accKind, acc);

  // Expression-specific overlays (blush, sweat, etc.)
  drawExpressionOverlay(ctx, ox, oy, exp, skin);
}

function drawHeadShape(ctx, ox, oy, shape, skin) {
  // Base oval — outline first, fill afterwards
  const baseFill = skin[1];
  // Defaults
  let top = 12, bottom = 70, left = 24, right = 71;
  switch (shape) {
    case 'Round':   top = 14; bottom = 68; left = 26; right = 69; break;
    case 'Heart':   top = 12; bottom = 70; left = 24; right = 71; break;
    case 'Square':  top = 14; bottom = 70; left = 24; right = 71; break;
    case 'Long':    top = 10; bottom = 72; left = 26; right = 69; break;
    case 'Diamond': top = 13; bottom = 71; left = 26; right = 69; break;
  }
  const w = right - left + 1;
  const h = bottom - top + 1;
  // crude rounded rectangle: fill main, then trim corners
  rect(ctx, ox + left, oy + top, w, h, baseFill);
  // round corners (4 px notch)
  const corner = shape === 'Square' ? 2 : shape === 'Round' ? 6 : 4;
  for (let i = 0; i < corner; i++) {
    const k = corner - i;
    rect(ctx, ox + left + i, oy + top, k, 1, 'rgba(0,0,0,0)');
    rect(ctx, ox + right - i, oy + top, 1, 1, 'rgba(0,0,0,0)');
    rect(ctx, ox + right - i - (k - 1), oy + top, k, 1, 'rgba(0,0,0,0)');
    if (shape !== 'Square' && shape !== 'Long') {
      rect(ctx, ox + left + i, oy + bottom - k + 1, 1, k, 'rgba(0,0,0,0)');
      rect(ctx, ox + right - i, oy + bottom - k + 1, 1, k, 'rgba(0,0,0,0)');
    }
  }
}

function drawBrows(ctx, ox, oy, exp, hair) {
  const browColor = hair[0];
  // base
  let lY = 36, rY = 36, lLen = 8, rLen = 8;
  let lTilt = 0, rTilt = 0;
  switch (exp) {
    case 'Angry':
    case 'Fierce':
      lTilt = 1; rTilt = -1; break;
    case 'Sad':
    case 'Worried':
      lTilt = -1; rTilt = 1; break;
    case 'Surprised':
      lY = 33; rY = 33; break;
    case 'Sleepy':
    case 'Bored':
      lY = 38; rY = 38; break;
  }
  for (let i = 0; i < lLen; i++) rect(ctx, ox + 33 + i, oy + lY + Math.round((i/lLen)*lTilt), 1, 2, browColor);
  for (let i = 0; i < rLen; i++) rect(ctx, ox + 55 + i, oy + rY + Math.round(((lLen - i)/lLen)*rTilt), 1, 2, browColor);
}

function drawEyes(ctx, ox, oy, exp, skin, eye) {
  // Eye whites + iris
  const drawEye = (cx) => {
    rect(ctx, ox + cx,     oy + 42, 8, 6, '#f5f3ee');
    rect(ctx, ox + cx,     oy + 42, 8, 1, skin[0]);
    rect(ctx, ox + cx + 2, oy + 43, 4, 4, eye[1]);
    rect(ctx, ox + cx + 3, oy + 44, 2, 2, eye[3]);
    rect(ctx, ox + cx + 3, oy + 44, 1, 1, '#ffffff');
  };
  if (exp === 'Sleepy' || exp === 'Bored') {
    // Half closed
    rect(ctx, ox + 33, oy + 45, 8, 1, skin[0]);
    rect(ctx, ox + 55, oy + 45, 8, 1, skin[0]);
    rect(ctx, ox + 33, oy + 46, 8, 1, '#f5f3ee');
    rect(ctx, ox + 55, oy + 46, 8, 1, '#f5f3ee');
    return;
  }
  if (exp === 'Wink') {
    drawEye(33);
    rect(ctx, ox + 55, oy + 45, 8, 1, skin[0]);
    return;
  }
  if (exp === 'Surprised') {
    drawEye(33);
    drawEye(55);
    // bigger iris
    rect(ctx, ox + 35, oy + 43, 4, 4, eye[1]);
    rect(ctx, ox + 57, oy + 43, 4, 4, eye[1]);
    return;
  }
  if (exp === 'Joyful') {
    // ^_^
    rect(ctx, ox + 33, oy + 44, 2, 1, skin[0]);
    rect(ctx, ox + 35, oy + 43, 2, 1, skin[0]);
    rect(ctx, ox + 37, oy + 44, 2, 1, skin[0]);
    rect(ctx, ox + 39, oy + 45, 2, 1, skin[0]);
    rect(ctx, ox + 55, oy + 45, 2, 1, skin[0]);
    rect(ctx, ox + 57, oy + 44, 2, 1, skin[0]);
    rect(ctx, ox + 59, oy + 43, 2, 1, skin[0]);
    rect(ctx, ox + 61, oy + 44, 2, 1, skin[0]);
    return;
  }
  drawEye(33);
  drawEye(55);
}

function drawMouth(ctx, ox, oy, exp, skin) {
  const lipDark = skin[0];
  const lipMid = '#aa3a4f';
  switch (exp) {
    case 'Smile':
    case 'Joyful':
      rect(ctx, ox + 42, oy + 60, 12, 1, lipDark);
      rect(ctx, ox + 41, oy + 59, 1, 1, lipDark);
      rect(ctx, ox + 54, oy + 59, 1, 1, lipDark);
      rect(ctx, ox + 43, oy + 61, 10, 1, lipMid);
      break;
    case 'Smirk':
      rect(ctx, ox + 44, oy + 60, 8, 1, lipDark);
      rect(ctx, ox + 51, oy + 59, 2, 1, lipDark);
      break;
    case 'Frown':
    case 'Sad':
    case 'Worried':
      rect(ctx, ox + 42, oy + 61, 12, 1, lipDark);
      rect(ctx, ox + 41, oy + 62, 1, 1, lipDark);
      rect(ctx, ox + 54, oy + 62, 1, 1, lipDark);
      break;
    case 'Angry':
    case 'Fierce':
      rect(ctx, ox + 42, oy + 60, 12, 1, lipDark);
      rect(ctx, ox + 44, oy + 61, 8, 1, lipMid);
      break;
    case 'Surprised':
      rect(ctx, ox + 45, oy + 59, 6, 4, lipDark);
      rect(ctx, ox + 46, oy + 60, 4, 2, '#3a1620');
      break;
    case 'Shy':
      rect(ctx, ox + 44, oy + 60, 8, 1, lipDark);
      break;
    case 'Sleepy':
    case 'Bored':
    case 'Stoic':
    case 'Determined':
    case 'Neutral':
    default:
      rect(ctx, ox + 44, oy + 60, 8, 1, lipDark);
  }
}

function drawHairFace(ctx, ox, oy, style, hair, shape) {
  const [s, m, l, h] = hair;
  // crown / top of head — covers y=10..28 mostly
  rect(ctx, ox + 24, oy + 10, 48, 22, m);
  rect(ctx, ox + 24, oy + 10, 48, 2,  s);
  rect(ctx, ox + 28, oy + 13, 40, 2,  l);
  rect(ctx, ox + 64, oy + 14, 4, 6, h);

  // Temple/sideburns down to ear region
  rect(ctx, ox + 24, oy + 28, 4, 16, m);
  rect(ctx, ox + 68, oy + 28, 4, 16, m);

  switch (style) {
    case 'Long':
    case 'Hime-Cut':
    case 'Wavy':
    case 'Curly':
      rect(ctx, ox + 22, oy + 30, 4, 50, m);
      rect(ctx, ox + 70, oy + 30, 4, 50, m);
      rect(ctx, ox + 22, oy + 78, 4, 4, s);
      rect(ctx, ox + 70, oy + 78, 4, 4, s);
      // back hair behind shoulders
      rect(ctx, ox + 22, oy + 78, 52, 4, m);
      break;
    case 'Twintails':
      rect(ctx, ox + 14, oy + 30, 8, 30, m);
      rect(ctx, ox + 74, oy + 30, 8, 30, m);
      rect(ctx, ox + 14, oy + 56, 8, 4, s);
      rect(ctx, ox + 74, oy + 56, 8, 4, s);
      break;
    case 'Ponytail':
      rect(ctx, ox + 70, oy + 18, 10, 30, m);
      rect(ctx, ox + 70, oy + 44, 10, 4, s);
      break;
    case 'Bob':
      rect(ctx, ox + 24, oy + 28, 4, 22, m);
      rect(ctx, ox + 68, oy + 28, 4, 22, m);
      rect(ctx, ox + 24, oy + 48, 48, 4, m);
      rect(ctx, ox + 24, oy + 48, 48, 1, s);
      break;
    case 'Pixie':
      // base only; trim near ears
      rect(ctx, ox + 24, oy + 26, 4, 6, m);
      rect(ctx, ox + 68, oy + 26, 4, 6, m);
      break;
    case 'Mohawk':
      rect(ctx, ox + 44, oy + 4, 8, 10, h);
      rect(ctx, ox + 44, oy + 4, 8, 2, l);
      break;
    case 'Spiky':
      for (let i = 0; i < 6; i++) {
        const sx = 28 + i * 6;
        rect(ctx, ox + sx, oy + 4, 4, 8, m);
        rect(ctx, ox + sx + 1, oy + 4, 2, 2, l);
      }
      break;
    case 'Bun':
    case 'Topknot':
      rect(ctx, ox + 42, oy + 2, 12, 10, m);
      rect(ctx, ox + 42, oy + 2, 12, 2, s);
      rect(ctx, ox + 44, oy + 4, 8, 2, l);
      break;
    case 'Side-Swept': {
      rect(ctx, ox + 24, oy + 14, 36, 8, m);
      rect(ctx, ox + 24, oy + 14, 36, 2, s);
      break;
    }
    case 'Faux-Hawk':
      rect(ctx, ox + 40, oy + 4, 16, 10, m);
      rect(ctx, ox + 44, oy + 4, 8, 2, l);
      break;
    case 'Buzz':
      // shave: thinner, no bangs
      rect(ctx, ox + 24, oy + 14, 48, 4, s);
      break;
    case 'Braid': {
      rect(ctx, ox + 22, oy + 30, 4, 50, m);
      rect(ctx, ox + 22, oy + 36, 4, 1, s);
      rect(ctx, ox + 22, oy + 44, 4, 1, s);
      rect(ctx, ox + 22, oy + 52, 4, 1, s);
      rect(ctx, ox + 22, oy + 60, 4, 1, s);
      break;
    }
  }
}

function drawAccessoryFace(ctx, ox, oy, kind, ramp) {
  if (kind === 'None') return;
  const [s, m, l, h] = ramp;
  switch (kind) {
    case 'Headband':
      rect(ctx, ox + 22, oy + 26, 52, 4, m);
      rect(ctx, ox + 22, oy + 26, 52, 1, l);
      rect(ctx, ox + 46, oy + 26, 4, 4, h);
      break;
    case 'Circlet':
      rect(ctx, ox + 26, oy + 22, 44, 2, m);
      rect(ctx, ox + 44, oy + 18, 8, 6, h);
      rect(ctx, ox + 46, oy + 19, 4, 4, l);
      break;
    case 'Crown':
      rect(ctx, ox + 26, oy + 16, 44, 2, m);
      rect(ctx, ox + 28, oy + 8,  4, 8, h);
      rect(ctx, ox + 36, oy + 6,  4, 10, h);
      rect(ctx, ox + 46, oy + 4,  4, 12, h);
      rect(ctx, ox + 56, oy + 6,  4, 10, h);
      rect(ctx, ox + 64, oy + 8,  4, 8, h);
      break;
    case 'Goggles':
      rect(ctx, ox + 30, oy + 38, 14, 12, m);
      rect(ctx, ox + 52, oy + 38, 14, 12, m);
      rect(ctx, ox + 32, oy + 40, 10, 8, s);
      rect(ctx, ox + 54, oy + 40, 10, 8, s);
      rect(ctx, ox + 33, oy + 41, 4, 2, h);
      rect(ctx, ox + 55, oy + 41, 4, 2, h);
      break;
    case 'Visor':
      rect(ctx, ox + 22, oy + 36, 52, 6, m);
      rect(ctx, ox + 22, oy + 36, 52, 1, l);
      rect(ctx, ox + 22, oy + 41, 52, 1, s);
      break;
    case 'Hood':
      rect(ctx, ox + 14, oy + 8, 68, 64, m);
      rect(ctx, ox + 22, oy + 16, 52, 56, 'rgba(0,0,0,0)'); // not really transparent in canvas paint, fix:
      // Re-stamp face area by drawing skin already done earlier — but order matters; we'll instead draw hood as a partial frame:
      break;
    case 'Hat':
      rect(ctx, ox + 12, oy + 18, 72, 4, s);
      rect(ctx, ox + 24, oy + 4,  48, 14, m);
      rect(ctx, ox + 24, oy + 4,  48, 2,  s);
      rect(ctx, ox + 28, oy + 8,  40, 4,  l);
      break;
    case 'Helmet':
      rect(ctx, ox + 22, oy + 8, 52, 26, m);
      rect(ctx, ox + 22, oy + 8, 52, 2,  s);
      rect(ctx, ox + 22, oy + 32, 52, 2, h);
      // cheek guards
      rect(ctx, ox + 22, oy + 34, 4, 24, m);
      rect(ctx, ox + 70, oy + 34, 4, 24, m);
      // T-slit
      rect(ctx, ox + 30, oy + 36, 36, 4, s);
      rect(ctx, ox + 46, oy + 40, 4, 14, s);
      break;
    case 'Mask':
      rect(ctx, ox + 24, oy + 38, 48, 14, m);
      rect(ctx, ox + 32, oy + 42, 8, 4, s);
      rect(ctx, ox + 56, oy + 42, 8, 4, s);
      break;
    case 'Earrings':
      rect(ctx, ox + 24, oy + 50, 2, 4, h);
      rect(ctx, ox + 70, oy + 50, 2, 4, h);
      break;
    case 'Scarf':
      rect(ctx, ox + 18, oy + 70, 60, 12, m);
      rect(ctx, ox + 18, oy + 70, 60, 2,  l);
      rect(ctx, ox + 18, oy + 80, 60, 2,  s);
      break;
    case 'Pauldron':
      rect(ctx, ox + 8,  oy + 80, 16, 16, m);
      rect(ctx, ox + 72, oy + 80, 16, 16, m);
      rect(ctx, ox + 8,  oy + 80, 16, 2, h);
      rect(ctx, ox + 72, oy + 80, 16, 2, h);
      break;
    case 'Eyepatch':
      rect(ctx, ox + 30, oy + 40, 16, 10, s);
      rect(ctx, ox + 28, oy + 44, 44, 2, s);
      break;
    case 'Horns':
      rect(ctx, ox + 22, oy + 4, 6, 12, m);
      rect(ctx, ox + 68, oy + 4, 6, 12, m);
      rect(ctx, ox + 24, oy + 6, 2, 6, h);
      rect(ctx, ox + 70, oy + 6, 2, 6, h);
      break;
    case 'Halo':
      rect(ctx, ox + 28, oy + 0, 40, 2, h);
      rect(ctx, ox + 24, oy + 2, 4, 2, h);
      rect(ctx, ox + 68, oy + 2, 4, 2, h);
      break;
    case 'Antennae':
      rect(ctx, ox + 36, oy + 0, 2, 12, m);
      rect(ctx, ox + 58, oy + 0, 2, 12, m);
      rect(ctx, ox + 35, oy + 0, 4, 2, h);
      rect(ctx, ox + 57, oy + 0, 4, 2, h);
      break;
    case 'Tiara':
      rect(ctx, ox + 32, oy + 22, 32, 2, h);
      rect(ctx, ox + 44, oy + 18, 8, 6, h);
      break;
    case 'Ribbon':
      rect(ctx, ox + 38, oy + 12, 20, 6, m);
      rect(ctx, ox + 38, oy + 12, 20, 2, h);
      break;
  }
}

function drawExpressionOverlay(ctx, ox, oy, exp, skin) {
  switch (exp) {
    case 'Shy':
      rect(ctx, ox + 28, oy + 52, 6, 4, '#ff8aa3');
      rect(ctx, ox + 62, oy + 52, 6, 4, '#ff8aa3');
      break;
    case 'Joyful':
      rect(ctx, ox + 28, oy + 54, 4, 2, '#ff9aaf');
      rect(ctx, ox + 64, oy + 54, 4, 2, '#ff9aaf');
      break;
    case 'Worried':
      rect(ctx, ox + 70, oy + 26, 2, 6, '#7fc7ff'); // sweatdrop
      rect(ctx, ox + 71, oy + 32, 1, 2, '#bfe0ff');
      break;
    case 'Determined':
      rect(ctx, ox + 30, oy + 30, 8, 1, skin[0]); // furrowed brow accent
      rect(ctx, ox + 58, oy + 30, 8, 1, skin[0]);
      break;
  }
}

export function renderFaceSheet(paramsList) {
  const { c, ctx } = makeCanvas(FACE_SHEET_W, FACE_SHEET_H);
  for (let i = 0; i < FACE_COLS * FACE_ROWS; i++) {
    const p = paramsList[i % paramsList.length];
    const col = i % FACE_COLS;
    const row = (i / FACE_COLS) | 0;
    drawFaceInto(ctx, col * FACE_W, row * FACE_H, p, p.expression);
  }
  return c;
}

export function renderSingleFace(params) {
  // Useful for previewing one face at a larger zoom in the UI.
  const { c, ctx } = makeCanvas(FACE_W, FACE_H);
  drawFaceInto(ctx, 0, 0, params, params.expression);
  return c;
}
