import { defineConfig } from "@bunli/core";

export default defineConfig({
  name: "wallet-cli",
  version: "0.1.0",
  description: "Ledger Wallet CLI",
  commands: {
    directory: "./src/commands",
  },
  // Entry is cli only — *.test.ts under src/ are typechecked but not compiled into the binary.
  build: {
    entry: "./src/cli.ts",
    outdir: "./dist",
    targets: ["native"],
    // Bundle the `usb` native addon into the executable. Marking it external breaks the standalone
    // binary: runtime resolution runs from bunfs (`/$bunfs/root/cli`) where node_modules is absent.
  },
});
