/**
 * Tests for metafile parsing utilities
 * Run with: pnpm test
 */

import {
  extractBundleSize,
  extractDuplicates,
  getMetafileFormat,
  isRspackMetafile,
  isEsbuildMetafile,
  type EsbuildMetafile,
  type RspackMetafile,
} from "./metafile";

// ============================================================================
// Test fixtures
// ============================================================================

const rspackMetafile: RspackMetafile = {
  assets: [
    { name: "renderer.bundle.js", size: 26_000_000 },
    { name: "main.bundle.js", size: 2_000_000 },
    { name: "preloader.bundle.js", size: 10_000 },
    { name: "assets/image-abc123.png", size: 50_000 },
  ],
  modules: [
    // Two versions of lodash
    { identifier: "/project/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/index.js" },
    { identifier: "/project/node_modules/.pnpm/lodash@4.17.20/node_modules/lodash/clone.js" },
    // Single version of react
    { identifier: "/project/node_modules/.pnpm/react@18.3.1/node_modules/react/index.js" },
    // Two versions of bn.js
    { identifier: "/project/node_modules/.pnpm/bn.js@4.12.0/node_modules/bn.js/lib/bn.js" },
    { identifier: "/project/node_modules/.pnpm/bn.js@5.2.1/node_modules/bn.js/lib/bn.js" },
    // Scoped package with two versions (pnpm uses + for /)
    { identifier: "/project/node_modules/.pnpm/@noble+hashes@1.3.0/node_modules/@noble/hashes/sha256.js" },
    { identifier: "/project/node_modules/.pnpm/@noble+hashes@1.4.0/node_modules/@noble/hashes/sha256.js" },
    // Local file (should be ignored)
    { name: "./src/index.ts" },
  ],
};

const esbuildMetafile: EsbuildMetafile = {
  inputs: {
    "src/index.ts": {
      bytes: 1000,
      imports: [
        { path: "node_modules/lodash/index.js", kind: "import-statement", original: "lodash" },
        { path: "node_modules/lodash-es/index.js", kind: "import-statement", original: "lodash" },
      ],
    },
    "src/utils.ts": {
      bytes: 500,
      imports: [
        { path: "node_modules/react/index.js", kind: "import-statement", original: "react" },
      ],
    },
  },
  outputs: {
    ".webpack/renderer.bundle.js": {
      imports: [],
      exports: [],
      inputs: { "src/index.ts": { bytesInOutput: 800 } },
      bytes: 25_000_000,
      entryPoint: "src/renderer/index.ts",
    },
    ".webpack/main.bundle.js": {
      imports: [],
      exports: [],
      inputs: { "src/main.ts": { bytesInOutput: 500 } },
      bytes: 1_500_000,
      entryPoint: "src/main/index.ts",
    },
  },
};

// ============================================================================
// Test runner
// ============================================================================

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

function assertArrayEqual<T>(actual: T[], expected: T[], message?: string) {
  if (JSON.stringify(actual.sort()) !== JSON.stringify(expected.sort())) {
    throw new Error(
      message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

// ============================================================================
// Tests
// ============================================================================

console.log("\n🧪 Running metafile tests...\n");

// Format detection tests
test("isRspackMetafile detects rspack format", () => {
  assertEqual(isRspackMetafile(rspackMetafile), true);
});

test("isRspackMetafile rejects esbuild format", () => {
  assertEqual(isRspackMetafile(esbuildMetafile), false);
});

test("isEsbuildMetafile detects esbuild format", () => {
  assertEqual(isEsbuildMetafile(esbuildMetafile), true);
});

test("isEsbuildMetafile rejects rspack format", () => {
  assertEqual(isEsbuildMetafile(rspackMetafile), false);
});

test("getMetafileFormat returns rspack for rspack metafile", () => {
  assertEqual(getMetafileFormat(rspackMetafile), "rspack");
});

test("getMetafileFormat returns esbuild for esbuild metafile", () => {
  assertEqual(getMetafileFormat(esbuildMetafile), "esbuild");
});

// Bundle size extraction tests
test("extractBundleSize extracts size from rspack metafile", () => {
  assertEqual(extractBundleSize(rspackMetafile, "renderer"), 26_000_000);
});

test("extractBundleSize extracts main size from rspack metafile", () => {
  assertEqual(extractBundleSize(rspackMetafile, "main"), 2_000_000);
});

test("extractBundleSize returns undefined for missing bundle in rspack", () => {
  assertEqual(extractBundleSize(rspackMetafile, "nonexistent"), undefined);
});

test("extractBundleSize extracts size from esbuild metafile", () => {
  assertEqual(extractBundleSize(esbuildMetafile, "renderer"), 25_000_000);
});

test("extractBundleSize extracts main size from esbuild metafile", () => {
  assertEqual(extractBundleSize(esbuildMetafile, "main"), 1_500_000);
});

test("extractBundleSize returns undefined for missing bundle in esbuild", () => {
  assertEqual(extractBundleSize(esbuildMetafile, "nonexistent"), undefined);
});

// Duplicate detection tests
test("extractDuplicates finds duplicates in esbuild metafile", () => {
  const duplicates = extractDuplicates(esbuildMetafile);
  assertArrayEqual(duplicates, ["lodash"]);
});

test("extractDuplicates finds duplicates in rspack metafile", () => {
  const duplicates = extractDuplicates(rspackMetafile);
  assertArrayEqual(duplicates, ["@noble/hashes", "bn.js", "lodash"]);
});

// ============================================================================
// Real metafile tests (if available)
// ============================================================================

import fs from "fs";
import path from "path";

const lldMetafilesPath = path.resolve(
  __dirname,
  "../../../../apps/ledger-live-desktop",
);

if (fs.existsSync(lldMetafilesPath)) {
  console.log("\n📂 Testing with real LLD metafiles...\n");

  const metafileNames = ["metafile.renderer.json", "metafile.main.json"];

  for (const name of metafileNames) {
    const filePath = path.join(lldMetafilesPath, name);
    if (fs.existsSync(filePath)) {
      const slug = name.replace("metafile.", "").replace(".json", "");

      test(`Real ${name}: can detect format`, () => {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const format = getMetafileFormat(content);
        if (format === "unknown") {
          throw new Error("Could not detect metafile format");
        }
        console.log(`   Format: ${format}`);
      });

      test(`Real ${name}: can extract bundle size`, () => {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const size = extractBundleSize(content, slug);
        if (size === undefined) {
          throw new Error("Could not extract bundle size");
        }
        const sizeMB = (size / 1024 / 1024).toFixed(2);
        console.log(`   Size: ${sizeMB} MB`);
      });

      test(`Real ${name}: can extract duplicates`, () => {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const duplicates = extractDuplicates(content);
        console.log(`   Duplicates: ${duplicates.length} packages`);
        if (duplicates.length > 0) {
          console.log(`   Examples: ${duplicates.slice(0, 5).join(", ")}`);
        }
      });
    }
  }
} else {
  console.log("\n⏭️  Skipping real metafile tests (no .webpack folder found)\n");
  console.log("   Run 'pnpm desktop build:js' first to generate metafiles.\n");
}

// ============================================================================
// Summary
// ============================================================================

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}

