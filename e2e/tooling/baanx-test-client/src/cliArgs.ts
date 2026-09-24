/**
 * Argument parsing for the CLI, kept separate from `cli.ts` so it can be tested
 * without importing that module's top-level entry point (which would attempt a
 * real login on import).
 */

export type OutputFormat = "token" | "json" | "session";

export type CliArgs =
  | { kind: "help" }
  | { kind: "run"; format: OutputFormat }
  | { kind: "unknown"; argument: string };

/**
 * `pnpm run token -- --json` forwards the `--` separator through to us, so it
 * is dropped rather than treated as an unrecognised argument.
 */
export function parseCliArgs(argv: string[]): CliArgs {
  const args = argv.filter(arg => arg !== "--");

  if (args.includes("--help") || args.includes("-h")) return { kind: "help" };

  const known = new Set(["--json", "--session"]);
  const unknown = args.find(arg => !known.has(arg));
  if (unknown !== undefined) return { kind: "unknown", argument: unknown };

  // `--session` wins: it is the more specific request.
  if (args.includes("--session")) return { kind: "run", format: "session" };
  return { kind: "run", format: args.includes("--json") ? "json" : "token" };
}

/**
 * Report only the flag name, never its value.
 *
 * Accidental `token -- --password=hunter2` or `token -- -phunter2` must not
 * write the secret into terminal scrollback or CI logs just because the flag
 * was rejected. Lives here rather than in cli.ts so tests can import it
 * without running the entry point.
 */
export function flagNameOf(argument: string): string {
  if (!argument.startsWith("-")) return "[redacted positional argument]";

  const eq = argument.indexOf("=");
  if (eq !== -1) return `${argument.slice(0, eq)}=[redacted]`;

  const isShortFlagWithGluedValue = !argument.startsWith("--") && argument.length > 2;
  if (isShortFlagWithGluedValue) return `${argument.slice(0, 2)}=[redacted]`;

  return argument;
}
