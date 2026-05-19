#!/usr/bin/env zx
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { minify } from "@swc/core";

const appRoot = resolve(import.meta.dirname, "..");
const positionalArgs = process.argv.slice(2).filter(arg => !arg.endsWith(".mjs"));
const inputPath = resolve(appRoot, positionalArgs[0] ?? "main.jsbundle");
const outputPath = resolve(appRoot, positionalArgs[1] ?? "main.jsbundle.minified");

if (!existsSync(inputPath)) {
  console.error(`Input bundle not found: ${inputPath}`);
  console.error("Run bundle first (e.g. e2e-ci --bundle) before minifying.");
  process.exit(1);
}

const code = await readFile(inputPath, "utf8");
const result = await minify(code, {
  compress: true,
  mangle: true,
  sourceMap: false,
  module: false,
});

if (!result.code) {
  console.error("Minification produced empty output");
  process.exit(1);
}

await writeFile(outputPath, result.code, "utf8");
console.log(`Minified ${inputPath} -> ${outputPath} (${result.code.length} bytes)`);
