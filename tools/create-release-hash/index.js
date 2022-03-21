const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

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
