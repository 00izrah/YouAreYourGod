// Compare AVIF / WebP quality settings on the *shadows* of a photograph.
//
//   npm run compare-quality -- src/assets/exhibitions/geometry-of-midday/05.jpg
//
// Writes encoded files + a cropped, brightness-boosted shadow patch per setting into
// ./quality-test/. Open the patches at 100% and look for banding in the dark gradients.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { basename, extname } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run compare-quality -- <image>');
  process.exit(1);
}

const out = 'quality-test';
await mkdir(out, { recursive: true });
const name = basename(file, extname(file));
const width = 1600;

// Find the darkest 400x300 region (by mean luminance) to inspect.
const base = sharp(file).resize({ width });
const { data, info } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
const win = { w: 400, h: 300 };
let best = { v: Infinity, x: 0, y: 0 };
for (let y = 0; y + win.h <= info.height; y += 50) {
  for (let x = 0; x + win.w <= info.width; x += 50) {
    let sum = 0;
    for (let yy = 0; yy < win.h; yy += 10) for (let xx = 0; xx < win.w; xx += 10) sum += data[(y + yy) * info.width + x + xx];
    const mean = sum / ((win.w / 10) * (win.h / 10));
    if (mean < best.v) best = { v: mean, x, y };
  }
}
console.log(`Darkest region: x=${best.x} y=${best.y} (mean luma ${best.v.toFixed(1)})\n`);

const variants = [
  ['avif', 50], ['avif', 60], ['avif', 68], ['avif', 75], ['avif', 85],
  ['webp', 70], ['webp', 80], ['webp', 84], ['webp', 90],
  ['jpeg', 80], ['jpeg', 86], ['jpeg', 92],
];

console.log('format  quality   size');
for (const [format, quality] of variants) {
  const buf = await base.clone().toFormat(format, { quality }).toBuffer();
  const tag = `${name}-${format}-q${quality}`;
  await sharp(buf).toFile(`${out}/${tag}.${format === 'jpeg' ? 'jpg' : format}`);
  // Shadow patch, lifted ×3 so banding becomes visible, upscaled ×2 for inspection.
  await sharp(buf)
    .extract({ left: best.x, top: best.y, width: win.w, height: win.h })
    .linear(3, 0)
    .resize({ width: win.w * 2, kernel: 'nearest' })
    .png()
    .toFile(`${out}/${tag}-shadows.png`);
  console.log(`${format.padEnd(7)} q${String(quality).padEnd(7)} ${(buf.length / 1024).toFixed(0).padStart(5)} KB`);
}
console.log(`\nPatches written to ./${out}/`);
