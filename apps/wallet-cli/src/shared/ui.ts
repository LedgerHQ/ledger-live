// Human-mode UX helpers: spinner + colors.
// Spinner writes to stderr so it doesn't pollute piped stdout output.

import yoctoSpinner from "yocto-spinner";
import type { Spinner } from "yocto-spinner";
import { colors, writeStdout as bunliWriteStdout } from "@bunli/utils";
export { colors };

type Writer = (chunk: string) => void;

let stdoutWriter: Writer | null = null;
let stderrWriter: Writer | null = null;

export function installOutputCapture(writers: { stdout?: Writer; stderr?: Writer }): () => void {
  const previousStdout = stdoutWriter;
  const previousStderr = stderrWriter;
  stdoutWriter = writers.stdout ?? null;
  stderrWriter = writers.stderr ?? null;
  return () => {
    stdoutWriter = previousStdout;
    stderrWriter = previousStderr;
  };
}

export function writeStdout(message: string): void {
  if (stdoutWriter) {
    stdoutWriter(message.endsWith("\n") ? message : `${message}\n`);
    return;
  }
  bunliWriteStdout(message);
}

export function writeStderr(message: string): void {
  if (stderrWriter) {
    stderrWriter(message);
    return;
  }
  process.stderr.write(message);
}

let activeSpinner: Spinner | null = null;

export function isAgentEnvironment(): boolean {
  return Boolean(
    process.env.CLAUDECODE ||
    process.env.CLAUDE_CODE ||
    process.env.CURSOR_AGENT ||
    process.env.CODEX_ENABLED ||
    process.env.GEMINI_CLI ||
    process.env.OPENCODE ||
    process.env.AMP_CURRENT_THREAD_ID ||
    process.env.AGENT === "amp",
  );
}

/**
 * Returns true when running in an interactive terminal.
 * Returns false when the CLI is piped, redirected, or invoked by an AI agent.
 * In those cases spinners are replaced by no-ops to avoid polluting output.
 *
 * Detection:
 *  - TTY check: process.stderr.isTTY must be true
 *  - AI agent env vars: same signals used by @bunli/plugin-ai-detect
 */
export function isInteractive(): boolean {
  if (isAgentEnvironment()) return false;
  return process.stderr.isTTY === true;
}

/** Singleton no-op spinner used in non-interactive contexts. */
const noopMethod = () => noopSpinner;
const noopSpinner: Spinner = new Proxy({} as Spinner, {
  get(_t, prop) {
    if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
    if (prop === "isSpinning") return false;
    if (prop === "text") return "";
    if (prop === "indent") return 0;
    return noopMethod;
  },
  set() {
    return true;
  },
});

export function spinner(text: string): Spinner {
  if (!isInteractive()) return noopSpinner;
  if (activeSpinner?.isSpinning) {
    activeSpinner.stop();
  }
  activeSpinner = yoctoSpinner({ text, stream: process.stderr }).start();
  return activeSpinner;
}

/**
 * Best-effort terminal cursor restore.
 *
 * yocto-spinner hides the cursor (`\x1b[?25l`) while spinning and only restores it on
 * stop/success/error. When the CLI is force-killed via SIGINT/SIGTERM mid-spin, the
 * show-cursor escape is never written and the user's terminal is left without a visible
 * cursor. We write `\x1b[?25h` directly to stderr (where the spinner stream lives) as a
 * safety net before termination.
 */
export function restoreTerminalCursor(): void {
  if (!process.stderr.isTTY) return;
  try {
    writeStderr("\x1b[?25h");
  } catch {
    // stderr may already be closed during teardown; ignore.
  }
}

export async function withSpinner<T>(
  text: string,
  successText: string,
  fn: () => Promise<T>,
  humanMode: boolean,
): Promise<T> {
  const spin = humanMode ? spinner(text) : null;
  try {
    const result = await fn();
    spin?.success(successText);
    return result;
  } catch (err) {
    spin?.error("Failed");
    throw err;
  }
}
