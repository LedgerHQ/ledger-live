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

/**
 * Wrap `url` in an OSC 8 terminal hyperlink so it is clickable in terminals that support it
 * (Ghostty, iTerm2, kitty, WezTerm, …). Clicking hands the URL to the OS opener, which routes
 * custom schemes like `ledgerlive://` to the registered app.
 *
 * Only emitted when stdout is a real TTY and we are not under an AI agent; otherwise plain text is
 * returned so piped/redirected output, agent captures, and terminals without OSC 8 support stay
 * clean. The raw URL is always kept copy-pasteable: when a custom label differs from the URL the
 * fallback is `label (url)` so the URL is never dropped.
 */
export function hyperlink(url: string, label: string = url): string {
  if (process.stdout.isTTY !== true || isAgentEnvironment()) {
    return label === url ? url : `${label} (${url})`;
  }
  // url/label can be backend-derived (e.g. liveAppId → deeplink); strip control chars so they can't
  // inject their own escape sequences (ESC/BEL/CSI) into the OSC 8 wrapper and hijack the terminal.
  return `\x1b]8;;${stripControlChars(url)}\x1b\\${stripControlChars(label)}\x1b]8;;\x1b\\`;
}

/** Remove C0/C1 control characters (incl. ESC and BEL) that could break out of an escape sequence. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f-\x9f]/g;
function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
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
