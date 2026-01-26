#!/usr/bin/env node
import { DotLottieV1 } from "@dotlottie/dotlottie-js";
import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
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

const { files, stats } = JSON.parse(readFileSync(listPath, "utf8"));

console.log("🚀 Starting conversion of Lottie files to .lottie format...\n");
console.log(`📊 Total files to convert: ${files.length}`);
console.log(`📦 Total size: ${stats.totalSize.mb} MB\n`);

let converted = 0;
let skipped = 0;
let errors = 0;

async function convertFile(fileInfo) {
  const { absolutePath, path: relativePath, size } = fileInfo;
  const outputPath = absolutePath.replace(".json", ".lottie");

  if (existsSync(outputPath)) {
    console.log(`⏭️  Skipped (already exists): ${relativePath}`);
    skipped++;
    return;
  }

  try {
    const jsonData = JSON.parse(readFileSync(absolutePath, "utf8"));
    const dotLottie = new DotLottieV1();

    dotLottie.setAuthor("Ledger").addAnimation({
      id: basename(relativePath, ".json"),
      data: jsonData,
      loop: true,
      autoplay: true,
    });

    const buffer = await dotLottie.toArrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));

    const newStat = statSync(outputPath);
    const newSize = newStat.size;
    const reduction = ((1 - newSize / size.bytes) * 100).toFixed(1);
    const newSizeMB = (newSize / (1024 * 1024)).toFixed(2);

    console.log(`✅ ${relativePath}`);
    console.log(`   ${size.mb} MB → ${newSizeMB} MB (${reduction}% reduction)`);
    converted++;
  } catch (error) {
    console.error(`❌ Error converting ${relativePath}:`, error.message);
    errors++;
  }
}

for (const file of files) {
  await convertFile(file);
}

console.log("\n" + "=".repeat(60));
console.log("📊 Conversion Summary:");
console.log(`   ✅ Converted: ${converted} files`);
console.log(`   ⏭️  Skipped: ${skipped} files`);
console.log(`   ❌ Errors: ${errors} files`);
console.log("=".repeat(60));

if (converted > 0) {
  console.log("\n💡 Next steps:");
  console.log("   1. Update metro.config.js to support .lottie extension");
  console.log("   2. Install @lottiefiles/dotlottie-react-native if needed");
  console.log("   3. Test the animations in your app");
  console.log("   4. Update imports to use .lottie files");
  console.log("   5. Delete old .json files once everything works");
}
