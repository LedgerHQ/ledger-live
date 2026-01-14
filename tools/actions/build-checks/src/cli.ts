#!/usr/bin/env tsx
/**
 * CLI to analyze metafiles locally
 * Usage: pnpm cli <path-to-metafile.json> [slug]
 *
 * Examples:
 *   pnpm cli ../../apps/ledger-live-desktop/metafile.renderer.json renderer
 *   pnpm cli ../../apps/ledger-live-desktop/metafile.main.json main
 */

import fs from "fs";
import path from "path";
import {
  extractBundleSize,
  extractDuplicates,
  getMetafileFormat,
  type Metafile,
} from "./metafile";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
📊 Metafile Analyzer CLI

Usage: pnpm cli <path-to-metafile.json> [slug]

Arguments:
  path    Path to the metafile JSON
  slug    Bundle slug (e.g., "renderer", "main"). Defaults to filename.

Examples:
  pnpm cli ../../apps/ledger-live-desktop/metafile.renderer.json
  pnpm cli ../../apps/ledger-live-desktop/metafile.main.json main
  pnpm cli /path/to/metafile.renderer.json renderer
`);
    process.exit(0);
  }

  const filePath = args[0];
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ File not found: ${resolvedPath}`);
    process.exit(1);
  }

  // Infer slug from filename if not provided
  // e.g., "metafile.renderer.json" -> "renderer"
  const filename = path.basename(filePath);
  const slugMatch = filename.match(/metafile\.(\w+)\.json/);
  const slug = args[1] || slugMatch?.[1] || "unknown";

  console.log(`\n📄 Analyzing: ${resolvedPath}`);
  console.log(`   Slug: ${slug}\n`);

  let content: Metafile;
  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    content = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Failed to parse JSON: ${e}`);
    process.exit(1);
  }

  // Format detection
  const format = getMetafileFormat(content);
  console.log(`📦 Format: ${format}`);

  // Bundle size
  const size = extractBundleSize(content, slug);
  if (size !== undefined) {
    console.log(`📏 Bundle Size: ${formatSize(size)}`);
  } else {
    console.log(`📏 Bundle Size: Could not extract (slug "${slug}" not found)`);
  }

  // Duplicates
  const duplicates = extractDuplicates(content);
  console.log(`\n🔄 Duplicate Packages: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log("\n   Package Name");
    console.log("   " + "-".repeat(40));
    for (const pkg of duplicates) {
      console.log(`   ${pkg}`);
    }
  }

  console.log("");
}

main();

