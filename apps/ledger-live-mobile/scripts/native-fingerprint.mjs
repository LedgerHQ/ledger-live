// Prints "<platform>=<hash>" for each platform argument: the Expo fingerprint used as the e2e native build cache key.
// Usage: node scripts/native-fingerprint.mjs ios android
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// The fingerprint version that ships with expo, so the hash moves with the expo upgrade.
const { createFingerprintAsync } = createRequire(require.resolve("expo/package.json"))(
  "@expo/fingerprint",
);
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
// Fingerprint ignores a config that fails to load and hashes without it, so load it here first to fail loudly.
require("../fingerprint.config.js");

// Fingerprint hashes a workspace native module's whole dir for each platform: leave out the other platform's sources.
const NATIVE_PERFORMANCE = "../../shared/native-performance";
const otherPlatformPaths = {
  ios: [`${NATIVE_PERFORMANCE}/android/**`],
  android: [`${NATIVE_PERFORMANCE}/ios/**`, `${NATIVE_PERFORMANCE}/*.podspec`],
};

for (const platform of process.argv.slice(2)) {
  const { hash, sources } = await createFingerprintAsync(projectRoot, {
    platforms: [platform],
    ignorePaths: otherPlatformPaths[platform],
  });
  if (!sources.some(source => source.reasons?.includes("e2eNativeBuild"))) {
    throw new Error("fingerprint.config.js was not applied");
  }
  console.log(`${platform}=${hash}`);
}
