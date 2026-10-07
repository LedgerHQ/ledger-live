// Compiles src/cli.ts into one standalone Bun executable per release target:
// dist/<target>/cli (cli.exe on Windows), the layout prepare-npm.mjs packages.
//
//   node scripts/build.mjs            all release targets
//   node scripts/build.mjs native     the current platform only
//   node scripts/build.mjs linux-x64  the listed targets
//
// Only src/cli.ts is compiled: *.test.ts files are typechecked but never reach the binary.
// The `usb` native addon is embedded through a literal require() in src/embed-usb-native.ts,
// because node-gyp-build resolves it dynamically where Bun can't see it. With --minify,
// process.platform branches are dead-code-eliminated per target.
import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const RELEASE_TARGETS = ["darwin-arm64", "linux-arm64", "linux-x64", "windows-x64"];

const args = process.argv.slice(2);
const targets =
  args.length === 0 ? RELEASE_TARGETS : args.map(arg => (arg === "native" ? nativeTarget() : arg));

function nativeTarget() {
  const platform = process.platform === "win32" ? "windows" : process.platform;
  return `${platform}-${process.arch}`;
}

await rm(path.join(root, "dist"), { recursive: true, force: true });

for (const target of targets) {
  const outfile = path.join("dist", target, target.startsWith("windows") ? "cli.exe" : "cli");
  console.log(`Compiling ${outfile}`);
  const result = spawnSync(
    "bun",
    [
      "build",
      "src/cli.ts",
      "--compile",
      "--minify",
      `--target=bun-${target}`,
      `--outfile=${outfile}`,
    ],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Compilation failed for ${target}`);
    process.exit(result.status ?? 1);
  }
}
