// Reads EXIF + a dominant colour from image files and prints a frontmatter stub.
//
//   npm run frame-meta -- src/assets/exhibitions/my-room/*.jpg
//
// Review the output before publishing. Nothing here ships to visitors: the build
// pipeline (sharp) strips metadata from every generated variant, so GPS coordinates
// in a master never reach the public files.
import sharp from 'sharp';
import exifr from 'exifr';
import { basename } from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: npm run frame-meta -- <image files...>');
  process.exit(1);
}

const hex = (n) => n.toString(16).padStart(2, '0');

for (const [i, file] of files.entries()) {
  const { data } = await sharp(file).resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const color = `#${hex(data[0])}${hex(data[1])}${hex(data[2])}`;

  let exif = {};
  try {
    exif = (await exifr.parse(file, { gps: true })) ?? {};
  } catch {}

  const date = exif.DateTimeOriginal ? new Date(exif.DateTimeOriginal).toISOString().slice(0, 10) : 'YYYY-MM-DD';
  const camera = [exif.Make, exif.Model].filter(Boolean).join(' ');
  const lens = exif.LensModel ?? '';
  const gps = exif.latitude != null ? `${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)}` : 'none';

  console.log(`  # ${basename(file)}  (camera: ${camera || '—'}; lens: ${lens || '—'}; gps: ${gps})`);
  console.log(`  - id: frame-${String(i + 1).padStart(2, '0')}`);
  console.log(`    title: ""`);
  console.log(`    medium: "${camera || 'Digital negative'}"`);
  console.log(`    location: ""`);
  console.log(`    date: ${date}`);
  console.log(`    curatorialNote: ""`);
  console.log(`    alt: ""`);
  console.log(`    image: ./${basename(file)}`);
  console.log(`    dominantColor: "${color}"`);
  console.log('');
}
