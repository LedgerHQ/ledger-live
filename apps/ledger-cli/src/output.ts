import ora, { type Ora } from "ora";
import chalk from "chalk";

export type OutputFormat = "human" | "json";

// A no-op spinner for JSON mode (keeps stdout clean for piping)
const noopSpinner: Ora = {
  start: () => noopSpinner,
  stop: () => noopSpinner,
  succeed: () => noopSpinner,
  fail: () => noopSpinner,
  warn: () => noopSpinner,
  info: () => noopSpinner,
  stopAndPersist: () => noopSpinner,
  clear: () => noopSpinner,
  render: () => noopSpinner,
  frame: () => "",
  text: "",
  prefixText: "",
  color: "white",
  indent: 0,
  isSpinning: false,
  interval: 80,
  spinner: { frames: [""], interval: 80 },
  suffixText: "",
} as unknown as Ora;

/**
 * Create a spinner. In JSON mode returns a no-op (all spinners write to stderr anyway,
 * but avoiding even stderr output makes JSON output fully predictable).
 */
export function createSpinner(format: OutputFormat): Ora {
  if (format === "json") return noopSpinner;
  return ora({ stream: process.stderr });
}

/**
 * Write a JSON object to stdout as a single line (NDJSON).
 * JSON mode: one object per line, suitable for piping to jq etc.
 */
export function outputJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data) + "\n");
}

/**
 * Write a human-readable line to stdout.
 */
export function outputLine(line: string): void {
  process.stdout.write(line + "\n");
}

/**
 * Print a section header in human mode.
 */
export function outputHeader(title: string): void {
  process.stdout.write(chalk.bold.cyan(title) + "\n");
}

/**
 * Print an error to stderr.
 */
export function outputError(err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(chalk.red("Error: ") + msg + "\n");
}

/**
 * Wrap an async command with consistent error handling and cleanup.
 */
export async function runCommand(
  format: OutputFormat,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (format === "json") {
      outputJson({ error: err instanceof Error ? err.message : String(err) });
    } else {
      outputError(err);
    }
    process.exit(1);
  }
}

export { chalk };
