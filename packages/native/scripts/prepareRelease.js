const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

const destination = path.join(__dirname, "..", "lib");

// Cleanup destination folder.
fs.removeSync(destination);

// Build step.
child_process.execSync("npm run build", { stdio: "inherit" });

// Copy files that we want to include in the published package.
const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "src/assets/fonts",
];
requiredFiles.forEach((filename) => {
  const suffix = filename.startsWith("src/") ? filename.slice(4) : filename;
  const filePath = path.join(__dirname, "..", filename);
  const destPath = path.join(destination, suffix);
  fs.copySync(filePath, destPath);
});

// Remove the private, script, dev. deps. and main fields from the package json file.
const packageJsonPath = path.join(destination, "package.json");
const package = require(packageJsonPath);
delete package.private;
delete package.scripts;
delete package.devDependencies;
delete package.main;
fs.writeFileSync(packageJsonPath, JSON.stringify(package, null, 2));
