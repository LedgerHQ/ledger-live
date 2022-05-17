const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

const destination = path.join(__dirname, "..", "lib");

// Copy files that we want to include in the published package.
const requiredFiles = ["src/assets/fonts"];

requiredFiles.forEach((filename) => {
  const suffix = filename.startsWith("src/") ? filename.slice(4) : filename;
  const filePath = path.join(__dirname, "..", filename);
  const destPath = path.join(destination, suffix);
  fs.copySync(filePath, destPath);
});
