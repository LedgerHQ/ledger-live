import fs from "fs";
import path from "path";
import { platformBuild } from "./builds.mts";

const corruptedDir = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "corrupted");

// Like a download altered on its way: the signed feed announces the update, but its binary is
// served from a copy with one byte changed. Returns the feed paths to serve from the copy.
export function corruptUpdate(version: string) {
  const binary = platformBuild().feedBinary(version);
  const corruptedBinary = path.join(corruptedDir, path.basename(binary));

  fs.rmSync(corruptedDir, { recursive: true, force: true });
  fs.mkdirSync(corruptedDir, { recursive: true });
  fs.copyFileSync(binary, corruptedBinary);
  flipMiddleByte(corruptedBinary);
  console.log(`Serving ${corruptedBinary} in place of ${path.basename(binary)}`);

  return new Map([[path.basename(binary), corruptedBinary]]);
}

function flipMiddleByte(file: string) {
  const fd = fs.openSync(file, "r+");
  try {
    const position = Math.floor(fs.fstatSync(fd).size / 2);
    const byte = Buffer.alloc(1);
    fs.readSync(fd, byte, 0, 1, position);
    byte[0] ^= 0xff;
    fs.writeSync(fd, byte, 0, 1, position);
  } finally {
    fs.closeSync(fd);
  }
}
