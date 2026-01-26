#!/usr/bin/env node
import { readFileSync, unlinkSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const listPath = join(projectRoot, "scripts", "lottie-files-list.json");

if (!existsSync(listPath)) {
  console.error("❌ Error: lottie-files-list.json not found!");
  console.error('💡 Run "pnpm animations:list" first to generate the list.');
  process.exit(1);
}

const { files } = JSON.parse(readFileSync(listPath, "utf8"));

let deleted = 0;
let skipped = 0;
let totalSizeFreed = 0;

console.log("🗑️  Cleaning up old .json Lottie files...\n");
console.log(
  "⚠️  WARNING: This will permanently delete .json files that have .lottie equivalents!\n",
);

for (const fileInfo of files) {
  const { absolutePath, path: relativePath, size } = fileInfo;
  const lottieEquivalent = absolutePath.replace(".json", ".lottie");

  if (existsSync(lottieEquivalent)) {
    try {
      unlinkSync(absolutePath);
      deleted++;
      totalSizeFreed += size.bytes;
      console.log(`🗑️  Deleted: ${relativePath}`);
    } catch (error) {
      console.error(`❌ Error deleting ${relativePath}:`, error.message);
    }
  } else {
    console.log(`⏭️  Skipped (no .lottie found): ${relativePath}`);
    skipped++;
  }
}

const totalSizeFreedMB = (totalSizeFreed / (1024 * 1024)).toFixed(2);

console.log("\n" + "=".repeat(60));
console.log("📊 Cleanup Summary:");
console.log(`   🗑️  Deleted: ${deleted} files`);
console.log(`   ⏭️  Skipped: ${skipped} files`);
console.log(`   💾 Space freed: ${totalSizeFreedMB} MB`);
console.log("=".repeat(60));

if (deleted > 0) {
  console.log("\n✅ Cleanup complete!");
  console.log("💡 Your app bundle is now smaller by ~" + totalSizeFreedMB + " MB");
}
