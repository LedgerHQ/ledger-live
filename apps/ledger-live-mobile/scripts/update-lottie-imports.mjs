#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const srcDir = join(projectRoot, "src");

let filesUpdated = 0;
let importsReplaced = 0;

function updateImportsInFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf8");
    const originalContent = content;

    const updatedContent = content.replace(
      /from\s+["']([^"']*\.json)["']/g,
      (match, importPath) => {
        if (
          importPath.includes("animations/") ||
          importPath.includes("/assets/") ||
          importPath.endsWith("animations.json") ||
          (importPath.includes("/") && importPath.endsWith(".json"))
        ) {
          const lottieImport = importPath.replace(/\.json$/, ".lottie");
          importsReplaced++;
          return `from "${lottieImport}"`;
        }
        return match;
      },
    );

    if (updatedContent !== originalContent) {
      writeFileSync(filePath, updatedContent, "utf8");
      filesUpdated++;
      console.log(`✅ Updated: ${filePath.replace(projectRoot, "")}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir) {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!["node_modules", ".git", "build", "dist"].includes(file)) {
        walkDirectory(filePath);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      updateImportsInFile(filePath);
    }
  }
}

console.log("🔄 Updating Lottie imports from .json to .lottie...\n");

walkDirectory(srcDir);

console.log("\n" + "=".repeat(60));
console.log("📊 Update Summary:");
console.log(`   ✅ Files updated: ${filesUpdated}`);
console.log(`   🔄 Imports replaced: ${importsReplaced}`);
console.log("=".repeat(60));

if (filesUpdated > 0) {
  console.log("\n💡 Next steps:");
  console.log("   1. Test your app to ensure animations work");
  console.log("   2. Delete old .json files: pnpm animations:cleanup");
  console.log("   3. Restart Metro bundler if needed");
}
