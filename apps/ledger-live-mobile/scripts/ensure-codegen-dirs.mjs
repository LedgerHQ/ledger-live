#!/usr/bin/env node
/**
 * Ensure codegen directories exist for React Native New Architecture.
 *
 * This works around a React Native 0.79 bug where autolinking generates CMake files
 * referencing codegen directories before those directories are created, causing
 * "add_subdirectory given source which is not an existing directory" errors.
 *
 * The proper fix would be for RN to ensure these directories exist or to handle
 * missing directories gracefully in autolinking, but until then we create empty
 * placeholder directories.
 */

import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const nodeModulesPath = join(projectRoot, "node_modules");

// Packages that use New Architecture and need codegen directories
const packages = [
  "@braze/react-native-sdk",
  "@datadog/mobile-react-native",
  "@react-native-async-storage/async-storage",
  "@react-native-clipboard/clipboard",
  "@react-native-community/blur",
  "lottie-react-native",
  "react-native-ble-plx",
  "react-native-fast-shadow",
  "react-native-gesture-handler",
  "react-native-haptic-feedback",
  "react-native-image-picker",
  "react-native-keychain",
  "react-native-mmkv",
  "react-native-pager-view",
  "react-native-performance",
  "react-native-share",
  "react-native-webview",
];

packages.forEach(pkg => {
  const codegenPath = join(nodeModulesPath, pkg, "android/build/generated/source/codegen/jni");
  try {
    mkdirSync(codegenPath, { recursive: true });
    console.log(`✓ Created codegen directory for ${pkg}`);
  } catch (err) {
    // Directory might already exist or package not installed - that's fine
    if (err.code !== "EEXIST") {
      console.warn(`⚠ Could not create codegen directory for ${pkg}: ${err.message}`);
    }
  }
});

console.log("✓ Codegen directories ensured");
