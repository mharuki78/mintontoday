import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Keep browser and home-screen icons in sync with the editable brand mark.
const output = path => fileURLToPath(new URL(path, import.meta.url));
const logo = await readFile(output("../public/logo.svg"));
await writeFile(output("../app/icon.svg"), logo);
await sharp(logo).resize(180, 180).flatten({ background: "#DCECDF" }).png()
  .toFile(output("../app/apple-icon.png"));
await sharp(logo).resize(512, 512).png().toFile(output("../public/logo.png"));

const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(size => sharp(logo).resize(size, size).png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
images.forEach((png, i) => {
  const entry = 6 + i * 16;
  header[entry] = sizes[i];
  header[entry + 1] = sizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(output("../app/favicon.ico"), Buffer.concat([header, ...images]));
