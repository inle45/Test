// RPG Maker MV character sprite sheet.
//   3 columns (walk frames: 0=left-step, 1=idle, 2=right-step)
//   4 rows    (directions:  0=Down, 1=Left, 2=Right, 3=Up)
//   48 x 48 px per frame  =>  144 x 192 sheet
//
// Frames are built on a 48x48 canvas at 1:1 (no scaling). Anatomy is laid
// out as a set of parametric "boxes" over the sprite cell, then layers
// (skin / armor / hair / accessory) paint into those boxes using their
// 4-stop palette ramp.

import { makeCanvas, rect } from '../lib/pixel.js';
import { DB } from '../data/db.js';
import { makeRng, hashSeed } from '../lib/rng.js';

const FRAME_W = 48;
const FRAME_H = 48;
const COLS = 3;
const ROWS = 4;

export const SPRITE_SHEET_W = FRAME_W * COLS;
export const SPRITE_SHEET_H = FRAME_H * ROWS;

// Resolve a generation request. `params` may contain explicit ids,
// otherwise the rng picks. Returns the resolved descriptor.
export function resolveSpriteParams(seedString, overrides = {}) {
  const rng = makeRng(hashSeed(seedString));
  const skin = overrides.skin       ?? rng.pick(DB.skins);
  const hair = overrides.hair       ?? rng.pick(DB.hairs);
  const armor = overrides.armor     ?? rng.pick(DB.armors);
  const accessory = overrides.accessory ?? rng.pick(DB.accessories);
  const eye = overrides.eye         ?? rng.pick(DB.eyes);
  return { seed: seedString, skin, hair, armor, accessory, eye };
}

// Anatomy on a 48x48 cell (centered, feet at y=47).
//   head:    columns 18..29, rows 11..22   (12x12)
//   neck:    columns 22..25, rows 23..24
//   torso:   columns 17..30, rows 25..35   (14x11)
//   l-arm:   columns 14..16, rows 26..32
//   r-arm:   columns 31..33, rows 26..32
//   l-leg:   columns 18..22, rows 36..46
//   r-leg:   columns 25..29, rows 36..46
//   feet:    rows 47

function drawDownFrame(ctx, ox, oy, p, walk /* -1 | 0 | 1 */) {
  const skin = p.skin.ramp;
  const armor = p.armor.ramp;
  const hair = p.hair.ramp;
  const eye = p.eye.ramp;
  const acc = p.accessory.ramp;
  const accKind = p.accessory.kind;
  const hairStyle = p.hair.style;

  // tiny vertical bob on walk frames
  const bob = walk === 0 ? 0 : -1;
  const top = oy + bob;

  // Legs (animated): stride pushes one leg forward (1px) and back (1px).
  const llDx = walk === -1 ? -1 : walk === 1 ? 1 : 0;
  const rlDx = walk === -1 ? 1  : walk === 1 ? -1 : 0;

  // Feet shadow
  rect(ctx, ox + 17, oy + 47, 14, 1, 'rgba(0,0,0,0.0)'); // placeholder (no AA)

  // Pants/Boots (use armor[0] shadow, [1] mid)
  rect(ctx, ox + 18 + llDx, oy + 36, 5, 11, armor[1]);
  rect(ctx, ox + 18 + llDx, oy + 36, 1, 11, armor[0]);
  rect(ctx, ox + 22 + llDx, oy + 36, 1, 11, armor[0]);
  rect(ctx, ox + 25 + rlDx, oy + 36, 5, 11, armor[1]);
  rect(ctx, ox + 25 + rlDx, oy + 36, 1, 11, armor[0]);
  rect(ctx, ox + 29 + rlDx, oy + 36, 1, 11, armor[0]);
  // boots
  rect(ctx, ox + 18 + llDx, oy + 45, 5, 2, armor[0]);
  rect(ctx, ox + 25 + rlDx, oy + 45, 5, 2, armor[0]);

  // Torso (armor)
  rect(ctx, ox + 17, top + 25, 14, 11, armor[1]);
  rect(ctx, ox + 17, top + 25, 14, 1, armor[2]);     // top highlight band
  rect(ctx, ox + 17, top + 35, 14, 1, armor[0]);     // bottom shadow band
  rect(ctx, ox + 17, top + 25, 1, 11, armor[0]);     // left side shadow
  rect(ctx, ox + 30, top + 25, 1, 11, armor[2]);     // right side highlight
  // Buckle / collar accent
  rect(ctx, ox + 23, top + 26, 2, 1, armor[3]);
  rect(ctx, ox + 22, top + 30, 4, 1, armor[3]);

  // Arms (skin sleeves out of armor)
  rect(ctx, ox + 14, top + 26, 3, 7, armor[1]);
  rect(ctx, ox + 14, top + 26, 3, 1, armor[2]);
  rect(ctx, ox + 14, top + 32, 3, 1, armor[0]);
  rect(ctx, ox + 31, top + 26, 3, 7, armor[1]);
  rect(ctx, ox + 31, top + 26, 3, 1, armor[2]);
  rect(ctx, ox + 31, top + 32, 3, 1, armor[0]);
  // hands
  rect(ctx, ox + 14, top + 33, 3, 2, skin[1]);
  rect(ctx, ox + 31, top + 33, 3, 2, skin[1]);

  // Neck
  rect(ctx, ox + 22, top + 23, 4, 2, skin[0]);
  rect(ctx, ox + 22, top + 23, 4, 1, skin[1]);

  // Head (12x12)
  rect(ctx, ox + 18, top + 11, 12, 12, skin[1]);
  // jaw shadow
  rect(ctx, ox + 18, top + 22, 12, 1, skin[0]);
  // cheek highlight
  rect(ctx, ox + 28, top + 14, 1, 5, skin[2]);
  rect(ctx, ox + 19, top + 14, 1, 5, skin[0]);
  // chin
  rect(ctx, ox + 22, top + 22, 4, 1, skin[0]);

  // Eyes
  rect(ctx, ox + 21, top + 17, 2, 2, eye[0]);
  rect(ctx, ox + 25, top + 17, 2, 2, eye[0]);
  rect(ctx, ox + 22, top + 17, 1, 1, eye[2]);
  rect(ctx, ox + 26, top + 17, 1, 1, eye[2]);
  // mouth
  rect(ctx, ox + 23, top + 20, 2, 1, skin[0]);

  // Hair: style-driven coverage on top of head
  drawHairDown(ctx, ox, top, hair, hairStyle);

  // Accessory
  drawAccessoryDown(ctx, ox, top, acc, accKind);
}

function drawHairDown(ctx, ox, top, hair, style) {
  const [s, m, l, h] = hair;
  // Default cap covering forehead row 11..14 and sides
  rect(ctx, ox + 18, top + 11, 12, 4, m);
  rect(ctx, ox + 18, top + 11, 12, 1, s);    // top shadow
  rect(ctx, ox + 19, top + 12, 10, 1, l);    // light band
  rect(ctx, ox + 28, top + 12, 1, 1, h);     // hilight

  switch (style) {
    case 'Long':
      rect(ctx, ox + 17, top + 15, 1, 11, m);
      rect(ctx, ox + 30, top + 15, 1, 11, m);
      rect(ctx, ox + 17, top + 25, 14, 1, s);
      break;
    case 'Twintails':
      rect(ctx, ox + 14, top + 15, 3, 8, m);
      rect(ctx, ox + 31, top + 15, 3, 8, m);
      rect(ctx, ox + 14, top + 22, 3, 1, s);
      rect(ctx, ox + 31, top + 22, 3, 1, s);
      break;
    case 'Ponytail':
      rect(ctx, ox + 30, top + 13, 2, 8, m);
      rect(ctx, ox + 30, top + 20, 2, 1, s);
      break;
    case 'Mohawk':
      rect(ctx, ox + 23, top + 9, 2, 3, h);
      rect(ctx, ox + 23, top + 9, 2, 1, l);
      break;
    case 'Spiky':
      rect(ctx, ox + 18, top + 10, 1, 1, m);
      rect(ctx, ox + 21, top + 9,  1, 2, m);
      rect(ctx, ox + 24, top + 9,  1, 2, m);
      rect(ctx, ox + 27, top + 9,  1, 2, m);
      rect(ctx, ox + 29, top + 10, 1, 1, m);
      break;
    case 'Bun':
      rect(ctx, ox + 22, top + 8, 4, 3, m);
      rect(ctx, ox + 22, top + 8, 4, 1, s);
      rect(ctx, ox + 23, top + 9, 2, 1, l);
      break;
    case 'Hime-Cut':
      rect(ctx, ox + 17, top + 15, 1, 9, m);
      rect(ctx, ox + 30, top + 15, 1, 9, m);
      rect(ctx, ox + 18, top + 11, 12, 5, m);
      rect(ctx, ox + 18, top + 13, 12, 1, l);
      break;
    case 'Wavy':
      rect(ctx, ox + 17, top + 14, 1, 9, m);
      rect(ctx, ox + 30, top + 14, 1, 9, m);
      rect(ctx, ox + 16, top + 16, 1, 1, m);
      rect(ctx, ox + 31, top + 18, 1, 1, m);
      break;
    case 'Curly':
      rect(ctx, ox + 16, top + 12, 1, 1, m);
      rect(ctx, ox + 31, top + 12, 1, 1, m);
      rect(ctx, ox + 17, top + 11, 1, 1, m);
      rect(ctx, ox + 30, top + 11, 1, 1, m);
      rect(ctx, ox + 19, top + 10, 1, 1, m);
      rect(ctx, ox + 28, top + 10, 1, 1, m);
      break;
    case 'Braid':
      rect(ctx, ox + 16, top + 16, 1, 9, m);
      rect(ctx, ox + 16, top + 18, 1, 1, s);
      rect(ctx, ox + 16, top + 22, 1, 1, s);
      break;
    case 'Topknot':
      rect(ctx, ox + 23, top + 7, 2, 3, m);
      rect(ctx, ox + 22, top + 8, 4, 1, s);
      break;
    case 'Faux-Hawk':
      rect(ctx, ox + 22, top + 9, 4, 2, m);
      rect(ctx, ox + 23, top + 9, 2, 1, l);
      break;
    case 'Side-Swept':
      rect(ctx, ox + 18, top + 10, 8, 2, m);
      rect(ctx, ox + 18, top + 10, 8, 1, s);
      rect(ctx, ox + 19, top + 11, 6, 1, l);
      break;
    case 'Pixie':
    case 'Bob':
    case 'Cap':
    default:
      // base cap is enough
      break;
  }
}

function drawAccessoryDown(ctx, ox, top, ramp, kind) {
  if (kind === 'None') return;
  const [s, m, l, h] = ramp;
  switch (kind) {
    case 'Headband':
      rect(ctx, ox + 18, top + 14, 12, 1, m);
      rect(ctx, ox + 18, top + 14, 12, 1, l);
      rect(ctx, ox + 23, top + 14, 2, 1, h);
      break;
    case 'Circlet':
      rect(ctx, ox + 18, top + 13, 12, 1, m);
      rect(ctx, ox + 23, top + 12, 2, 2, h);
      break;
    case 'Crown':
      rect(ctx, ox + 18, top + 12, 12, 1, m);
      rect(ctx, ox + 19, top + 10, 1, 2, h);
      rect(ctx, ox + 23, top + 9,  2, 3, h);
      rect(ctx, ox + 28, top + 10, 1, 2, h);
      break;
    case 'Goggles':
      rect(ctx, ox + 19, top + 16, 4, 3, m);
      rect(ctx, ox + 25, top + 16, 4, 3, m);
      rect(ctx, ox + 20, top + 17, 2, 1, l);
      rect(ctx, ox + 26, top + 17, 2, 1, l);
      break;
    case 'Visor':
      rect(ctx, ox + 18, top + 16, 12, 2, m);
      rect(ctx, ox + 18, top + 16, 12, 1, h);
      break;
    case 'Hood':
      rect(ctx, ox + 16, top + 10, 16, 14, m);
      rect(ctx, ox + 19, top + 13, 10, 9, 'rgba(0,0,0,0)'); // hood opening (handled by re-drawing skin/eyes after)
      // re-stamp face inside hood
      // (caller order ensures hood goes before face? we draw hood last, so face is hidden — instead draw partial:)
      break;
    case 'Cap':
      rect(ctx, ox + 17, top + 10, 14, 4, m);
      rect(ctx, ox + 17, top + 13, 14, 1, s);
      rect(ctx, ox + 30, top + 12, 4, 1, m); // brim
      break;
    case 'Helmet':
      rect(ctx, ox + 17, top + 10, 14, 6, m);
      rect(ctx, ox + 17, top + 10, 14, 1, s);
      rect(ctx, ox + 17, top + 15, 14, 1, h);
      // visor slit
      rect(ctx, ox + 19, top + 17, 10, 1, s);
      break;
    case 'Hat':
      rect(ctx, ox + 14, top + 12, 20, 1, s);
      rect(ctx, ox + 18, top + 7,  12, 5, m);
      rect(ctx, ox + 18, top + 7,  12, 1, s);
      break;
    case 'Tiara':
      rect(ctx, ox + 21, top + 12, 6, 1, h);
      rect(ctx, ox + 23, top + 11, 2, 1, h);
      break;
    case 'Mask':
      rect(ctx, ox + 18, top + 16, 12, 3, m);
      rect(ctx, ox + 21, top + 17, 2, 1, s);
      rect(ctx, ox + 25, top + 17, 2, 1, s);
      break;
    case 'Earrings':
      rect(ctx, ox + 17, top + 19, 1, 1, h);
      rect(ctx, ox + 30, top + 19, 1, 1, h);
      break;
    case 'Scarf':
      rect(ctx, ox + 17, top + 23, 14, 3, m);
      rect(ctx, ox + 17, top + 23, 14, 1, h);
      rect(ctx, ox + 17, top + 25, 14, 1, s);
      break;
    case 'Pauldron':
      rect(ctx, ox + 14, top + 24, 4, 4, m);
      rect(ctx, ox + 30, top + 24, 4, 4, m);
      rect(ctx, ox + 14, top + 24, 4, 1, h);
      rect(ctx, ox + 30, top + 24, 4, 1, h);
      break;
    case 'Eyepatch':
      rect(ctx, ox + 21, top + 17, 3, 2, s);
      rect(ctx, ox + 19, top + 17, 6, 1, s);
      break;
    case 'Horns':
      rect(ctx, ox + 18, top + 8,  2, 3, m);
      rect(ctx, ox + 28, top + 8,  2, 3, m);
      rect(ctx, ox + 19, top + 9,  1, 1, h);
      rect(ctx, ox + 29, top + 9,  1, 1, h);
      break;
    case 'Halo':
      rect(ctx, ox + 19, top + 7,  10, 1, h);
      rect(ctx, ox + 18, top + 8,  1, 1, h);
      rect(ctx, ox + 29, top + 8,  1, 1, h);
      break;
    case 'Antennae':
      rect(ctx, ox + 21, top + 7,  1, 4, m);
      rect(ctx, ox + 26, top + 7,  1, 4, m);
      rect(ctx, ox + 21, top + 6,  1, 1, h);
      rect(ctx, ox + 26, top + 6,  1, 1, h);
      break;
    case 'Ribbon':
      rect(ctx, ox + 22, top + 11, 4, 2, m);
      rect(ctx, ox + 22, top + 11, 4, 1, h);
      break;
  }
}

// Side view (left-facing). We draw it once, then mirror for right.
function drawSideFrame(ctx, ox, oy, p, walk, mirror /* boolean, true = facing right */) {
  // Build into an off-screen 48x48 buffer first, then optionally mirror.
  const { c: buf, ctx: bctx } = makeCanvas(FRAME_W, FRAME_H);
  drawSideInto(bctx, 0, 0, p, walk);
  if (mirror) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(ox + FRAME_W, oy);
    ctx.scale(-1, 1);
    ctx.drawImage(buf, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(buf, ox, oy);
  }
}

function drawSideInto(ctx, ox, oy, p, walk) {
  const skin = p.skin.ramp;
  const armor = p.armor.ramp;
  const hair = p.hair.ramp;
  const eye = p.eye.ramp;
  const acc = p.accessory.ramp;
  const accKind = p.accessory.kind;

  const bob = walk === 0 ? 0 : -1;
  const top = oy + bob;

  // Legs: front/back leg swap
  const frontDx = walk === -1 ? -1 : walk === 1 ? 1 : 0;
  const backDx  = walk === -1 ? 1  : walk === 1 ? -1 : 0;
  // back leg (drawn first, slightly darker)
  rect(ctx, ox + 22 + backDx, oy + 36, 4, 11, armor[0]);
  rect(ctx, ox + 22 + backDx, oy + 45, 4, 2, armor[0]);
  // front leg
  rect(ctx, ox + 22 + frontDx, oy + 36, 4, 11, armor[1]);
  rect(ctx, ox + 22 + frontDx, oy + 45, 4, 2, armor[0]);

  // Torso (side silhouette is narrower)
  rect(ctx, ox + 20, top + 25, 9, 11, armor[1]);
  rect(ctx, ox + 20, top + 25, 9, 1, armor[2]);
  rect(ctx, ox + 20, top + 35, 9, 1, armor[0]);
  rect(ctx, ox + 20, top + 25, 1, 11, armor[2]);
  rect(ctx, ox + 28, top + 25, 1, 11, armor[0]);

  // Arm (back arm + swinging front arm)
  const armSwing = walk === -1 ? 1 : walk === 1 ? -1 : 0;
  rect(ctx, ox + 23, top + 26, 2, 7, armor[0]);                 // back arm
  rect(ctx, ox + 19, top + 26 + armSwing, 2, 7, armor[1]);      // front arm
  rect(ctx, ox + 19, top + 33 + armSwing, 2, 2, skin[1]);       // front hand
  rect(ctx, ox + 23, top + 33, 2, 2, skin[0]);                  // back hand

  // Neck
  rect(ctx, ox + 22, top + 23, 4, 2, skin[0]);

  // Head (side)
  rect(ctx, ox + 18, top + 11, 12, 12, skin[1]);
  rect(ctx, ox + 18, top + 22, 12, 1, skin[0]);
  rect(ctx, ox + 17, top + 13, 1, 6, skin[1]);                  // nose bridge / face front
  rect(ctx, ox + 17, top + 17, 1, 1, skin[0]);                  // nose tip
  // ear
  rect(ctx, ox + 28, top + 16, 1, 3, skin[0]);

  // Eye (one visible)
  rect(ctx, ox + 20, top + 17, 2, 2, eye[0]);
  rect(ctx, ox + 20, top + 17, 1, 1, eye[2]);
  // mouth
  rect(ctx, ox + 19, top + 20, 1, 1, skin[0]);

  // Hair side
  drawHairSide(ctx, ox, top, hair, p.hair.style);
  // Accessory side
  drawAccessorySide(ctx, ox, top, acc, accKind);
}

function drawHairSide(ctx, ox, top, hair, style) {
  const [s, m, l, h] = hair;
  rect(ctx, ox + 17, top + 11, 13, 4, m);
  rect(ctx, ox + 17, top + 11, 13, 1, s);
  rect(ctx, ox + 18, top + 12, 11, 1, l);

  switch (style) {
    case 'Long':
      rect(ctx, ox + 29, top + 15, 1, 11, m);
      rect(ctx, ox + 28, top + 25, 2, 1, s);
      break;
    case 'Twintails':
    case 'Ponytail':
      rect(ctx, ox + 29, top + 14, 2, 9, m);
      rect(ctx, ox + 29, top + 22, 2, 1, s);
      break;
    case 'Mohawk':
    case 'Faux-Hawk':
      rect(ctx, ox + 22, top + 8, 5, 3, h);
      break;
    case 'Spiky':
      rect(ctx, ox + 17, top + 9, 1, 2, m);
      rect(ctx, ox + 20, top + 9, 1, 2, m);
      rect(ctx, ox + 23, top + 9, 1, 2, m);
      rect(ctx, ox + 26, top + 9, 1, 2, m);
      break;
    case 'Bun':
      rect(ctx, ox + 28, top + 9, 3, 3, m);
      break;
    case 'Curly':
      rect(ctx, ox + 16, top + 13, 1, 1, m);
      rect(ctx, ox + 30, top + 13, 1, 1, m);
      break;
  }
}

function drawAccessorySide(ctx, ox, top, ramp, kind) {
  if (kind === 'None') return;
  const [s, m, l, h] = ramp;
  switch (kind) {
    case 'Headband':
      rect(ctx, ox + 17, top + 14, 13, 1, m);
      rect(ctx, ox + 17, top + 14, 13, 1, l);
      break;
    case 'Circlet':
    case 'Crown':
      rect(ctx, ox + 17, top + 13, 13, 1, m);
      rect(ctx, ox + 23, top + 11, 2, 2, h);
      break;
    case 'Helmet':
      rect(ctx, ox + 16, top + 10, 14, 6, m);
      rect(ctx, ox + 16, top + 15, 14, 1, h);
      break;
    case 'Hat':
      rect(ctx, ox + 13, top + 12, 18, 1, s);
      rect(ctx, ox + 17, top + 7, 12, 5, m);
      break;
    case 'Cap':
      rect(ctx, ox + 16, top + 10, 14, 4, m);
      rect(ctx, ox + 12, top + 12, 5, 1, m); // brim toward face
      break;
    case 'Goggles':
    case 'Visor':
      rect(ctx, ox + 17, top + 16, 12, 2, m);
      rect(ctx, ox + 17, top + 16, 12, 1, h);
      break;
    case 'Hood':
      rect(ctx, ox + 15, top + 10, 16, 14, m);
      rect(ctx, ox + 19, top + 14, 8,  6,  s); // shadow
      break;
    case 'Mask':
      rect(ctx, ox + 17, top + 16, 6, 3, m);
      break;
    case 'Earrings':
      rect(ctx, ox + 27, top + 19, 1, 1, h);
      break;
    case 'Scarf':
      rect(ctx, ox + 19, top + 23, 11, 3, m);
      break;
    case 'Pauldron':
      rect(ctx, ox + 18, top + 24, 4, 4, m);
      rect(ctx, ox + 18, top + 24, 4, 1, h);
      break;
    case 'Eyepatch':
      rect(ctx, ox + 19, top + 17, 4, 2, s);
      break;
    case 'Horns':
      rect(ctx, ox + 18, top + 8, 2, 3, m);
      break;
    case 'Halo':
      rect(ctx, ox + 19, top + 7, 10, 1, h);
      break;
    case 'Antennae':
      rect(ctx, ox + 22, top + 6, 1, 5, m);
      break;
    case 'Tiara':
      rect(ctx, ox + 21, top + 12, 6, 1, h);
      break;
    case 'Ribbon':
      rect(ctx, ox + 22, top + 11, 4, 2, m);
      break;
  }
}

function drawUpFrame(ctx, ox, oy, p, walk) {
  // Back of the character: hair fully covers head, no eyes, no face.
  const skin = p.skin.ramp;
  const armor = p.armor.ramp;
  const hair = p.hair.ramp;

  const bob = walk === 0 ? 0 : -1;
  const top = oy + bob;

  const llDx = walk === -1 ? -1 : walk === 1 ? 1 : 0;
  const rlDx = walk === -1 ? 1  : walk === 1 ? -1 : 0;

  // Legs
  rect(ctx, ox + 18 + llDx, oy + 36, 5, 11, armor[1]);
  rect(ctx, ox + 18 + llDx, oy + 36, 1, 11, armor[0]);
  rect(ctx, ox + 25 + rlDx, oy + 36, 5, 11, armor[1]);
  rect(ctx, ox + 29 + rlDx, oy + 36, 1, 11, armor[0]);
  rect(ctx, ox + 18 + llDx, oy + 45, 5, 2, armor[0]);
  rect(ctx, ox + 25 + rlDx, oy + 45, 5, 2, armor[0]);

  // Torso
  rect(ctx, ox + 17, top + 25, 14, 11, armor[1]);
  rect(ctx, ox + 17, top + 25, 14, 1, armor[2]);
  rect(ctx, ox + 17, top + 35, 14, 1, armor[0]);

  // Arms
  rect(ctx, ox + 14, top + 26, 3, 7, armor[1]);
  rect(ctx, ox + 31, top + 26, 3, 7, armor[1]);
  rect(ctx, ox + 14, top + 33, 3, 2, skin[1]);
  rect(ctx, ox + 31, top + 33, 3, 2, skin[1]);

  // Neck (small, mostly hidden by hair)
  rect(ctx, ox + 22, top + 23, 4, 2, skin[0]);

  // Head fully covered by hair
  rect(ctx, ox + 17, top + 11, 14, 13, hair[1]);
  rect(ctx, ox + 17, top + 11, 14, 1, hair[0]);
  rect(ctx, ox + 18, top + 12, 12, 1, hair[2]);
  rect(ctx, ox + 27, top + 13, 1, 4, hair[3]);

  // Long hair down the back
  if (['Long', 'Hime-Cut', 'Wavy', 'Curly'].includes(p.hair.style)) {
    rect(ctx, ox + 18, top + 24, 12, 4, hair[1]);
    rect(ctx, ox + 18, top + 27, 12, 1, hair[0]);
  }
  if (p.hair.style === 'Ponytail' || p.hair.style === 'Twintails') {
    rect(ctx, ox + 22, top + 12, 4, 13, hair[1]);
    rect(ctx, ox + 22, top + 24, 4, 1, hair[0]);
  }
  if (p.hair.style === 'Bun' || p.hair.style === 'Topknot') {
    rect(ctx, ox + 22, top + 8, 4, 3, hair[1]);
  }
}

export function renderSpriteSheet(params) {
  const { c, ctx } = makeCanvas(SPRITE_SHEET_W, SPRITE_SHEET_H);
  // 4 directions: 0 Down, 1 Left, 2 Right, 3 Up
  for (let col = 0; col < COLS; col++) {
    const walk = col === 0 ? -1 : col === 1 ? 0 : 1;
    drawDownFrame(ctx, col * FRAME_W,         0 * FRAME_H, params, walk);
    drawSideFrame(ctx, col * FRAME_W,         1 * FRAME_H, params, walk, false); // left
    drawSideFrame(ctx, col * FRAME_W,         2 * FRAME_H, params, walk, true);  // right
    drawUpFrame  (ctx, col * FRAME_W,         3 * FRAME_H, params, walk);
  }
  return c;
}
