const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

const destination = path.join(__dirname, "..", "lib");

// Copy files that we want to include in the published package.
const requiredFiles = ["src/assets/images", "src/assets/fonts"];

requiredFiles.forEach((filename) => {
  const fromSrc = filename.startsWith("src/");
  const suffix = fromSrc ? filename.slice(4) : filename;
  const filePath = path.join(__dirname, "..", filename);
  const destPath = path.join(destination, suffix);
  fs.copySync(filePath, destPath);
  if (fromSrc) {
    // also copy to the cjs folder
    fs.copySync(filePath, path.join(destination, "cjs", suffix));
  }
});
