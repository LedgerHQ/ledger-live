import { readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgDir = join(__dirname, "../src/svg");
const maxSizeBytes = 10 * 1024; // 10KB

const svgFiles = readdirSync(svgDir).filter(file => file.endsWith(".svg"));
const oversizedFiles = [];

for (const file of svgFiles) {
  const filePath = join(svgDir, file);
  const stats = statSync(filePath);
  const sizeInBytes = stats.size;

  if (sizeInBytes > maxSizeBytes) {
    oversizedFiles.push({
      file,
      size: sizeInBytes,
    });
  }
}

if (oversizedFiles.length > 0) {
  const errorMessage = `Found ${oversizedFiles.length} SVG file(s) exceeding 10KB:\n${oversizedFiles
    .map(({ file, size }) => `  - ${file}: ${(size / 1024).toFixed(2)}KB`)
    .join(
      "\n",
    )}\n\nFor more information about icon size constraints, see:\nhttps://github.com/LedgerHQ/ledger-live/tree/develop/libs/ui/packages/crypto-icons#readme`;
  // Print error message and exit with error code for CI compatibility
  console.error(errorMessage);
  process.exit(1);
} else {
  console.log("All SVG files are within the 10KB size limit.");
}
