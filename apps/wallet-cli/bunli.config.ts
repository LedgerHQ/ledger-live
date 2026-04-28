import { defineConfig } from "@bunli/core";
import { WALLET_CLI_VERSION } from "./src/generated/build-channel";

export default defineConfig({
  name: "wallet-cli",
  version: WALLET_CLI_VERSION,
  description: "Ledger Wallet CLI",
  commands: {
    directory: "./src/commands",
  },
  // Entry is cli only — *.test.ts under src/ are typechecked but not compiled into the binary.
  build: {
    entry: "./src/cli.ts",
    outdir: "./dist",
    minify: true,
    targets: ["darwin-arm64", "linux-arm64", "linux-x64", "windows-x64"],
    // The `usb` native addon is embedded via a direct require() in src/embed-usb-native.ts.
    // node-gyp-build uses dynamic resolution that Bun can't detect; the explicit require() fixes that.
    // With minify, process.platform branches are dead-code-eliminated per target.
  },
});
