export type Options = {
  keep: number;
  dryRun: boolean;
  cwd: string;
};

export const DEFAULT_KEEP = 20;

const USAGE = `Usage: prune-changelogs [options]

  --keep=<n>    number of newest version entries to retain (default ${DEFAULT_KEEP})
  --dry-run     report what would change without writing
  --cwd=<dir>   workspace root to scan (default: process.cwd())
  -h, --help    show this message`;

export class UsageError extends Error {
  readonly usage = USAGE;
}

export function parseArgs(argv: string[]): Options {
  const options: Options = { keep: DEFAULT_KEEP, dryRun: false, cwd: process.cwd() };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") throw new UsageError("help requested");

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const match = /^--(keep|cwd)=(.+)$/.exec(arg);
    if (!match) throw new UsageError(`unknown argument: ${arg}`);

    if (match[1] === "cwd") {
      options.cwd = match[2];
      continue;
    }

    const keep = Number(match[2]);
    if (!Number.isInteger(keep) || keep < 1) {
      throw new UsageError(`--keep must be a positive integer, received "${match[2]}"`);
    }
    options.keep = keep;
  }

  return options;
}

export { USAGE };
