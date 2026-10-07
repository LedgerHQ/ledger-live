import { defineConfig } from "@bunli/core";
import pkg from "./package.json" with { type: "json" };

// Runtime metadata for createCLI() (help header, --version). Commands come from
// src/commands/registry.ts and the binary from scripts/build.mjs.
export default defineConfig({
  name: "wallet-cli",
  version: pkg.version,
  description: "Ledger Wallet CLI",
});
