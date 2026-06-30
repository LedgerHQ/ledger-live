#!/usr/bin/env node
/**
 * Bin shim for the `test-quarantine` CLI.
 *
 *
 * The `.ts` entry is resolved relative to this package, so it works whether this
 * bin is invoked from the package's own `node_modules` or linked into the
 * workspace root `node_modules/.bin`.
 */
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliEntry = resolve(__dirname, "../src/cli.ts");

await import(cliEntry);
