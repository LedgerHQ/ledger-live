#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const srcDir = join(projectRoot, "src");

function isLottieFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const jsonStart = content.substring(0, 500);

    return (
      jsonStart.includes('"v":') &&
      jsonStart.includes('"fr":') &&
      (jsonStart.includes('"ip":') || jsonStart.includes('"op":')) &&
      (jsonStart.includes('"w":') || jsonStart.includes('"h":'))
    );
  } catch (error) {
    return false;
  }
}

function walkDirectory(dir, fileList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!["node_modules", ".git", "build", "dist"].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.endsWith(".json") && !file.includes("package")) {
      if (isLottieFile(filePath)) {
        const relativePath = relative(projectRoot, filePath);
        const sizeInBytes = stat.size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

        fileList.push({
          path: relativePath,
          absolutePath: filePath,
          size: {
            bytes: sizeInBytes,
            kb: parseFloat(sizeInKB),
            mb: parseFloat(sizeInMB),
          },
          directory: dirname(relativePath),
        });
      }
    }
  }

  return fileList;
}

console.log("🔍 Scanning for Lottie files...\n");

const lottieFiles = walkDirectory(srcDir);

lottieFiles.sort((a, b) => b.size.bytes - a.size.bytes);

const totalSize = lottieFiles.reduce((sum, file) => sum + file.size.bytes, 0);
const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

const stats = {
  totalFiles: lottieFiles.length,
  totalSize: {
    bytes: totalSize,
    mb: parseFloat(totalSizeMB),
  },
  estimatedSizeAfterConversion: {
    min: parseFloat(((totalSize * 0.2) / (1024 * 1024)).toFixed(2)),
    max: parseFloat(((totalSize * 0.3) / (1024 * 1024)).toFixed(2)),
  },
  estimatedSavings: {
    min: parseFloat(((totalSize * 0.7) / (1024 * 1024)).toFixed(2)),
    max: parseFloat(((totalSize * 0.8) / (1024 * 1024)).toFixed(2)),
  },
  scannedAt: new Date().toISOString(),
};

const output = {
  stats,
  files: lottieFiles,
  directories: [...new Set(lottieFiles.map(f => f.directory))].sort(),
};

const outputPath = join(projectRoot, "scripts", "lottie-files-list.json");
writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

console.log("📊 Stats:");
console.log(`   Total files found: ${stats.totalFiles}`);
console.log(`   Total size: ${stats.totalSize.mb} MB`);
console.log(
  `   Estimated size after .lottie conversion: ${stats.estimatedSizeAfterConversion.min}-${stats.estimatedSizeAfterConversion.max} MB`,
);
console.log(
  `   Estimated savings: ${stats.estimatedSavings.min}-${stats.estimatedSavings.max} MB (70-80%)\n`,
);

console.log("📁 Top 10 largest files:");
lottieFiles.slice(0, 10).forEach((file, index) => {
  console.log(`   ${index + 1}. ${file.path} (${file.size.mb} MB)`);
});

console.log(`\n✅ Complete list saved to: ${relative(projectRoot, outputPath)}`);
console.log(`\n💡 Run 'pnpm animations:convert' to convert all files to .lottie format`);
