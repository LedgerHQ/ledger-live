import {
  computeLegacyScore,
  formatReport,
  GREEN_ABOVE,
  MIN_LINES,
  RED_BELOW,
  THANKS_REMOVED,
  type ChangedFile,
  type CountLines,
} from "../legacy-score";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isMergeConflictsPr } from "../pull-request";

const OVERRIDE_LABEL = "legacy-code-approved";
// GitHub lists at most 3000 files per pull request: a larger diff cannot be scored
const MAX_LISTED_FILES = 3000;

// The workflow checks out the PR merge commit, so head files are on disk
function countLinesInCheckout(): CountLines {
  let root: string;
  try {
    root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return () => undefined;
  }
  return path => {
    try {
      const content = readFileSync(join(root, path), "utf8");
      return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
    } catch {
      return undefined;
    }
  };
}

async function validateLegacyScore() {
  if (isMergeConflictsPr(danger.github.pr.title)) return;
  try {
    const { owner, repo, number } = danger.github.thisPR;
    const files: ChangedFile[] = await danger.github.api.paginate(
      danger.github.api.pulls.listFiles,
      { owner, repo, pull_number: number, per_page: 100 },
    );
    if (files.length >= MAX_LISTED_FILES) return;
    const report = computeLegacyScore(files, countLinesInCheckout());

    if (report.legacyRemoved >= THANKS_REMOVED) {
      message(`${report.legacyRemoved} lines removed from legacy areas, thanks! 🧹`);
    }
    if (report.newLines + report.legacyGrowth < MIN_LINES || report.score > GREEN_ABOVE) return;

    if (report.score < RED_BELOW) {
      const labels = new Set(
        danger.github.issue.labels.map((label: { name: string }) => label.name),
      );
      const summary = `Only ${Math.floor(report.score * 100)}% of the new code lands in the new architecture layers: move it out of \`libs/\` and app feature folders into \`shared/\`, \`domain/\` or \`features/\`. See the details below.`;
      if (labels.has(OVERRIDE_LABEL)) warn(summary);
      else fail(`${summary} Add the \`${OVERRIDE_LABEL}\` label if the legacy code is intended.`);
    }
    markdown(formatReport(report));
  } catch (error) {
    // A scoring failure must not block the PR
    console.warn("Could not compute the architecture score", error);
  }
}

export default validateLegacyScore;
