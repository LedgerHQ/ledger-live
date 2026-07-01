// Small output helpers shared by the `skill` subcommands. These use writeStdout /
// makeEnvelope directly (rather than the big CommandOutput abstraction) since skill
// commands are pure local file/text operations with no device or network context.

import { CliProcessExitError } from "../../cli-process-exit-error";
import { makeEnvelope } from "../../shared/response";
import { writeStdout, writeStderr } from "../../shared/ui";

export type SkillOutputFormat = "human" | "json";

export function emitJson(value: unknown): void {
  writeStdout(JSON.stringify(value));
}

export function skillEnvelope(
  command: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  return makeEnvelope(command, "all", data);
}

/** Uniform error handling: JSON error envelope or stderr line, then exit non-zero. */
export function failSkill(format: SkillOutputFormat, command: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (format === "json") {
    emitJson({ ok: false, error: { command, message } });
  } else {
    writeStderr(message + "\n");
  }
  throw new CliProcessExitError(1);
}
