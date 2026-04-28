import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type WalletCliReleaseChannel = "stable" | "prerelease";

const packageJsonPath = resolve(import.meta.dir, "../package.json");
const packageJson = readFileSync(packageJsonPath, "utf8");
const pkg = JSON.parse(packageJson) as { version?: string };
const isProductionBuild = process.argv.includes("--production");

if (!pkg.version) {
  throw new Error(
    `Missing "version" in ${packageJsonPath}. wallet-cli build metadata cannot be generated.`,
  );
}

const version = pkg.version;
const releaseChannel: WalletCliReleaseChannel = isProductionBuild ? "stable" : "prerelease";

const outputPath = resolve(import.meta.dir, "../src/generated/build-channel.ts");

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  [
    `export const WALLET_CLI_VERSION = "${version}";`,
    `export const WALLET_CLI_RELEASE_CHANNEL: "stable" | "prerelease" = "${releaseChannel}";`,
    "",
  ].join("\n"),
);
