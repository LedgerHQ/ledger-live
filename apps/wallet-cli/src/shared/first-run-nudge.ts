// One-time, agent-aware hint printed to stderr on the first real command,
// pointing the caller at `wallet-cli skill install`. Everything here is
// best-effort: the whole body is guarded so it can never disrupt the command
// being run or alter its exit code.

import { colors, isAgentEnvironment, writeStderr } from "./ui";
import { detectAgent } from "./agent-detection";
import { hasNudgeBeenShown, markNudgeShown } from "./first-run";

function isJsonOutput(argv: string[]): boolean {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    // Only `--output` has no short alias; `-o` is `--out` (an output file path)
    // in `ring encrypt/decrypt`, so treating it as `--output` here would misread
    // e.g. `ring encrypt -o json` (a file named "json") as JSON output.
    if (arg === "--output=json") return true;
    if (arg === "--output" && argv[i + 1] === "json") return true;
  }
  return false;
}

/**
 * True when argv carries no subcommand: an empty invocation, or one that leads
 * with a flag (`--help`, `-h`, `--version`, or any other flag-led root call).
 * bunli prints help/root output for all of these, so they aren't a "first real
 * command" and must not consume the one-time nudge.
 */
function isNonCommandInvocation(argv: string[]): boolean {
  return argv.length === 0 || argv[0].startsWith("-");
}

function buildMessage(): string {
  const { agent, label } = detectAgent();
  // Any detected agent maps to a valid `--agent` value, including the generic
  // "agents" bucket (-> .agents/skills), which is where Gemini CLI / opencode /
  // amp read their skills. A bare `skill install` defaults to --agent claude, so
  // omitting the flag here would point those users at the wrong directory.
  if (agent) {
    return (
      `Tip: install the Ledger wallet-cli skills so ${label} can drive this CLI:\n` +
      `  wallet-cli skill install --all --agent ${agent}\n`
    );
  }
  return `Tip: install the Ledger wallet-cli agent skills:\n  wallet-cli skill install --all\n`;
}

/**
 * Show the first-run nudge if appropriate, then persist a marker so it never
 * shows again for this user. Returns void and never throws.
 */
export function maybeShowFirstRunNudge(argv: string[]): void {
  try {
    // Opt-out. Empty string stays falsy so tests can re-enable the nudge.
    if (process.env.WALLET_CLI_NO_NUDGE) return;
    // Never pollute machine-readable output (also goes to stderr regardless).
    if (isJsonOutput(argv)) return;
    // Empty / flag-led invocations (help, version, bare root listing) aren't a
    // real command — don't consume the one-time nudge before the user runs one.
    if (isNonCommandInvocation(argv)) return;
    // The user is already engaging with skills.
    if (argv[0] === "skill") return;
    // Show for interactive humans and detected agents; stay quiet in plain pipes.
    if (!(process.stderr.isTTY === true || isAgentEnvironment())) return;
    if (hasNudgeBeenShown()) return;

    writeStderr(colors.dim(buildMessage()));
    markNudgeShown();
  } catch {
    // Never let the nudge disrupt the command or its exit code.
  }
}
