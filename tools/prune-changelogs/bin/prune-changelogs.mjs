#!/usr/bin/env node
/**
 * Bin shim for the `prune-changelogs` CLI.
 *
 * The `.ts` entry is resolved relative to this package, so it works whether
 * this bin is invoked from the package's own `node_modules` or linked into the
 * workspace root `node_modules/.bin`.
 */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { run } = await import(resolve(here, "../src/cli.ts"));
const { UsageError } = await import(resolve(here, "../src/args.ts"));

try {
  process.exitCode = await run(process.argv.slice(2));
} catch (error) {
  if (error instanceof UsageError) {
    const help = error.message === "help requested";
    console[help ? "log" : "error"](help ? error.usage : `${error.message}\n\n${error.usage}`);
    process.exitCode = help ? 0 : 2;
  } else {
    console.error(error instanceof Error ? (error.stack ?? error.message) : error);
    process.exitCode = 1;
  }
}
