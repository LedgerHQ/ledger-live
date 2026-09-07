import lint from "@commitlint/lint";
import load from "@commitlint/load";
import type { LintOptions, LintOutcome, QualifiedRules } from "@commitlint/types";
import config from "../../commitlint.config.js";

let resolving: ReturnType<typeof load> | undefined;

function resolved() {
  resolving ??= load(config);
  return resolving;
}

// Commits get the config in full, matching the CLI and the hk commit-msg hook.
export async function lintCommitMessage(message: string): Promise<LintOutcome> {
  const { rules, parserPreset } = await resolved();
  return lint(message, rules, {
    parserOpts: parserPreset?.parserOpts as LintOptions["parserOpts"],
  });
}

// Titles get only our own rules, not the config-conventional ones a one-line
// title cannot meaningfully satisfy. Deliberately laxer than the commit check.
export async function lintPrTitle(title: string): Promise<LintOutcome> {
  return lint(title, config.rules as QualifiedRules);
}
