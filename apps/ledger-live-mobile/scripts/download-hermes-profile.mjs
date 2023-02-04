#!/usr/bin/env zx

import fs from "fs";
import path from "path";

// replace the package name com.ledger.live by com.ledger.live.debug in
// AndroidManifest.xml as `react-native profile-hermes` is a bit too dumb to
// get the right package name derived from the appIdSuffix
const manifestPath = path.resolve(
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml",
);
const originalManifestContent = fs.readFileSync(manifestPath, "utf8");
const newManifestContent = originalManifestContent.replace(
  'package="com.ledger.live"',
  'package="com.ledger.live.debug"',
);

fs.writeFileSync(manifestPath, newManifestContent);

const destDirPath = path.resolve("temp");

if (!fs.existsSync(destDirPath)) {
  fs.mkdirSync("temp");
}

console.log(`
ℹ️  Now extracting the file from the Android device, then transforming it using source maps if available.
  This can take up to a minute.
`);

await $`npx react-native profile-hermes ${destDirPath}`;

console.log(`
ℹ️  Two ways to inspect this file:
  - open chrome devtools, go to the "Performance" tab and load the file'
  - open chrome, navigate to chrome://tracing and load the file"\
`);

console.log(`
ℹ️  If the file paths are not resolved, make sure to have the metro server running so that this script can pull the source maps
`);

fs.writeFileSync(manifestPath, originalManifestContent);
