const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

/**
 * createHashFile
 *
 * Reads the `dist` folder located at the same root where this script is run,
 * it creates a sha512 of each binary in that folder,
 * then create a ${name}-${version}.sha512sum file containing the sha512 of each binary
 *
 * The contents of `dist` folder should look like this
 * | dist
 * |--
 *   | ${name}-${version}-linux-x86_64.AppImage
 *   | ${name}-${version}-mac.dmg
 *   | ${name}-${version}-mac.zip
 *   | ${name}-${version}-win-x64.exe
 */
async function createHashFile() {
  const files = await fs.readdir(path.join(process.cwd(), "dist"));
  let fileName = files
    .find((file) => file.endsWith("linux-x86_64.AppImage"))
    .split("-linux-x86_64.AppImage")[0];
  fileName += ".sha512sum";
  await fs.writeFile(path.join(process.cwd(), fileName), "", "utf8");
  for (const file of files) {
    const buffer = await fs.readFile(path.join(process.cwd(), "dist", file));
    const hash = crypto.createHash("sha512");
    hash.update(buffer);
    const hex = hash.digest("hex");
    console.log(hex);
    await fs.appendFile(path.join(process.cwd(), fileName), `${hex} ${file}\n`);
  }
}

createHashFile().catch((err) => console.error(err));
