// Human-mode UX helpers: spinner + colors.
// Spinner writes to stderr so it doesn't pollute piped stdout output.

import yoctoSpinner from "yocto-spinner";
import type { Spinner } from "yocto-spinner";
export { colors, writeStdout } from "@bunli/utils";

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
  if (
    process.env.CLAUDECODE ||
    process.env.CLAUDE_CODE ||
    process.env.CURSOR_AGENT ||
    process.env.CODEX_ENABLED ||
    process.env.GEMINI_CLI ||
    process.env.OPENCODE ||
    process.env.AMP_CURRENT_THREAD_ID ||
    process.env.AGENT === "amp"
  )
    return false;
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
  return yoctoSpinner({ text, stream: process.stderr }).start();
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
