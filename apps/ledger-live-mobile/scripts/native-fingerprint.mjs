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

for (const platform of process.argv.slice(2)) {
  const { hash } = await createFingerprintAsync(projectRoot, { platforms: [platform] });
  console.log(`${platform}=${hash}`);
}
