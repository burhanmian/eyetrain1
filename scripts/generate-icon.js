/**
 * generate-icon.js
 *
 * Creates electron/icon.png (256x256) using only Node.js built-in modules.
 * No npm packages required.  Run before electron-builder:
 *
 *   node scripts/generate-icon.js
 */
'use strict';

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

// ── CRC-32 (required by PNG format) ──────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const lenB  = Buffer.allocUnsafe(4);
  lenB.writeUInt32BE(data.length);
  const crcB  = Buffer.allocUnsafe(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// ── PNG builder ───────────────────────────────────────────────────────────
function makePNG(w, h, pixelFn) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 2;  // RGB (no alpha – avoids NSIS icon alpha issues)
  ihdr[10] = ihdr[11] = ihdr[12] = 0;

  // Raw scanlines: 1 filter byte (None=0) + w*3 RGB bytes
  const raw = Buffer.allocUnsafe(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;          // filter = None
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixelFn(x, y);
      const o = y * (1 + w * 3) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 7 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0))
  ]);
}

// ── Icon drawing ─────────────────────────────────────────────────────────
// A humanoid skeleton on a dark background.
// Coordinates are normalised to [-1, 1] within a 0.9-radius circle.

const JOINTS = [
  [  0.00, -0.60 ],   //  0 head-top
  [  0.00, -0.44 ],   //  1 neck
  [  0.00, -0.15 ],   //  2 chest
  [  0.00,  0.15 ],   //  3 hips
  [ -0.22, -0.22 ],   //  4 left shoulder
  [  0.22, -0.22 ],   //  5 right shoulder
  [ -0.38, -0.02 ],   //  6 left elbow
  [  0.38, -0.02 ],   //  7 right elbow
  [ -0.44,  0.22 ],   //  8 left wrist
  [  0.44,  0.22 ],   //  9 right wrist
  [ -0.14,  0.38 ],   // 10 left knee
  [  0.14,  0.38 ],   // 11 right knee
  [ -0.14,  0.65 ],   // 12 left ankle
  [  0.14,  0.65 ],   // 13 right ankle
];

const BONES = [
  [1, 2], [2, 3],                 // torso
  [1, 4], [4, 6], [6, 8],         // left arm
  [1, 5], [5, 7], [7, 9],         // right arm
  [3, 10], [10, 12],              // left leg
  [3, 11], [11, 13],              // right leg
];

// Point-to-segment distance (2D)
function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function drawPixel(x, y) {
  const size = 256;
  // Map pixel to normalised space [-1, 1]
  const nx = (x / size - 0.5) * 2.1;
  const ny = (y / size - 0.5) * 2.1;

  // Dark background with a subtle radial gradient
  const r2 = nx * nx + ny * ny;
  const bgR = Math.round(8  + r2 * 4);
  const bgG = Math.round(8  + r2 * 3);
  const bgB = Math.round(26 + r2 * 20);

  // Head circle
  const hd = Math.hypot(nx - JOINTS[0][0], ny - JOINTS[0][1]);
  if (hd < 0.15) {
    const t = hd / 0.15;
    return [
      Math.round(0   + t * bgR),
      Math.round(204 * (1 - t * t)),
      Math.round(255 * (1 - t * 0.5))
    ];
  }

  // Bones
  for (const [a, b] of BONES) {
    const [ax, ay] = JOINTS[a];
    const [bx, by] = JOINTS[b];
    const d = ptSegDist(nx, ny, ax, ay, bx, by);
    if (d < 0.048) return [0, 230, 140];   // #00e68c  bone colour
    if (d < 0.072) {                        // soft glow around bone
      const t = (d - 0.048) / 0.024;
      return [
        Math.round(bgR * t),
        Math.round(80 * (1 - t)),
        Math.round(bgB * t + 50 * (1 - t))
      ];
    }
  }

  // Joint dots
  for (let i = 1; i < JOINTS.length; i++) {
    const [jx, jy] = JOINTS[i];
    const d = Math.hypot(nx - jx, ny - jy);
    if (d < 0.07) return [0, 180, 255];    // #00b4ff  joint colour
    if (d < 0.10) {
      const t = (d - 0.07) / 0.03;
      return [
        Math.round(bgR * t),
        Math.round(100 * (1 - t)),
        Math.round(bgB * t + 180 * (1 - t))
      ];
    }
  }

  // Outer ring border
  const dist = Math.hypot(x - size / 2, y - size / 2);
  if (dist > size * 0.48 && dist < size * 0.495) return [20, 0, 60];

  return [bgR, bgG, bgB];
}

// ── Write output ─────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', 'electron', 'icon.png');
const png = makePNG(256, 256, drawPixel);
fs.writeFileSync(outPath, png);
console.log(`Icon written: ${outPath}  (${(png.length / 1024).toFixed(1)} KB)`);
