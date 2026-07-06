import path from "node:path";

/**
 * These generators are invoked from CI (see `.github/workflows/generate-e2e-userdata.yml`)
 * via `pnpm --filter ledger-live-desktop-e2e-tests generate:*`, so the working directory
 * is the package dir. Data paths (base userdata, output dir) are expressed relative to the
 * repo root, so resolve them against the root regardless of cwd.
 * This file lives at e2e/desktop/scripts/generate/ → the repo root is four levels up.
 */
export const REPO_ROOT = path.resolve(__dirname, "../../../..");

export function resolveFromRoot(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(REPO_ROOT, p);
}

export type GeneratorArgs = {
  coin?: string[];
  outputDir?: string;
  base?: string;
};

/**
 * Minimal, dependency-free parser for the flags these generators accept:
 *   --coin/-c <id...>   repeatable or space-separated list of currency ids
 *   --outputDir/-o <dir>
 *   --base/-b <file>
 */
export function parseGeneratorArgs(argv: string[] = process.argv.slice(2)): GeneratorArgs {
  const out: GeneratorArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === "--coin" || token === "-c") {
      out.coin ??= [];
      while (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
        out.coin.push(argv[++i]);
      }
    } else if (token === "--outputDir" || token === "-o") {
      out.outputDir = argv[++i];
    } else if (token === "--base" || token === "-b") {
      out.base = argv[++i];
    }
  }
  return out;
}

/**
 * Runs a generator, printing its summary and setting a non-zero exit code on failure.
 * Exits explicitly once done: per-coin Speculos teardown happens in a `finally`, but the
 * Speculos HTTP client's keep-alive sockets can otherwise keep the event loop alive and
 * hang the CI step. The printed summaries are small, so stdout has drained by this point.
 */
export function runGenerator(run: (args: GeneratorArgs) => Promise<string>): void {
  run(parseGeneratorArgs())
    .then(result => {
      if (result) console.log(result);
    })
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    })
    .finally(() => {
      process.exit(process.exitCode ?? 0);
    });
}
