// What the scripts of the workflow's steps share. They run alone, from the build jobs' checkout of
// ci/, so nothing here imports from src/.
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";

/** A failure reported as an error annotation, without a stack trace. */
export class StepFailure extends Error {}

/** `file` resolved under the working directory, which is all the scripts read or write. */
export function insideWorkingDir(file: string): string {
  const root = process.cwd();
  const resolved = path.resolve(root, file);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new StepFailure(`${file} is outside the working directory ${root}`);
  }
  return resolved;
}

/** A system tool's output. Like src/measure/exec.ts's run(), it finds `tool` on the runner's PATH. */
export function toolOutput(
  tool: string,
  args: string[],
  encoding: BufferEncoding = "utf8",
): string {
  return execFileSync(tool, args, { encoding, maxBuffer: 1024 * 1024 * 1024 });
}

/** Appends to the job summary, when the step runs in GitHub Actions. */
export function appendSummary(markdown: string): void {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) appendFileSync(file, markdown);
}

/** Prints `message` and adds it to the job summary as a list item. */
export function summary(message: string): void {
  console.log(message);
  appendSummary(`- ${message}\n`);
}

/** Runs a step's `main`: a StepFailure becomes an error annotation and exit code 1. */
export async function runStep(name: string, main: () => Promise<void> | void): Promise<void> {
  try {
    await main();
  } catch (error) {
    if (!(error instanceof StepFailure)) throw error;
    console.error(`::error::startup-perf ${name}: ${error.message}`);
    process.exitCode = 1;
  }
}

/** A file's lines as awk reads them: no line for the final newline. */
export function linesOf(text: string): string[] {
  if (text === "") return [];
  return (text.endsWith("\n") ? text.slice(0, -1) : text).split("\n");
}

/** Lines back to text, each ending with a newline. */
export const textOf = (lines: string[]): string => lines.map(line => `${line}\n`).join("");

/** A verdict of src/analysis/analyze.ts that fails the measure job. */
export const isFailingVerdict = (verdict: string): boolean =>
  /^(FAIL|Not detected|Not enough pairs)/.test(verdict);

/** A PASS or FAIL of src/analysis/analyze.ts whose 95% interval contains the threshold. */
export const isInconclusiveVerdict = (verdict: string): boolean =>
  /^(PASS|FAIL)\b.*\(inconclusive: /.test(verdict);

export const countLines = (lines: string[], matches: (line: string) => boolean): number =>
  lines.filter(line => matches(line)).length;
