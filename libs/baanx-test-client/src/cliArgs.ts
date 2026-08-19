/**
 * Argument parsing for the CLI, kept separate from `cli.ts` so it can be tested
 * without importing that module's top-level entry point (which would attempt a
 * real login on import).
 */

export type CliArgs =
  | { kind: "help" }
  | { kind: "run"; asJson: boolean }
  | { kind: "unknown"; argument: string };

/**
 * `pnpm run token -- --json` forwards the `--` separator through to us, so it
 * is dropped rather than treated as an unrecognised argument.
 */
export function parseCliArgs(argv: string[]): CliArgs {
  const args = argv.filter(arg => arg !== "--");

  if (args.includes("--help") || args.includes("-h")) return { kind: "help" };

  const unknown = args.find(arg => arg !== "--json");
  if (unknown !== undefined) return { kind: "unknown", argument: unknown };

  return { kind: "run", asJson: args.includes("--json") };
}
