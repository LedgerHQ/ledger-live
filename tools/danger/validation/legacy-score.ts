import {
  computeLegacyScore,
  formatReport,
  GREEN_ABOVE,
  legacyGrowthRows,
  MIN_LINES,
  parseAllowlist,
  RED_BELOW,
  THANKS_REMOVED,
  type ChangedFile,
  type CountLines,
} from "../legacy-score.ts";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { isMergeConflictsPr } from "../pull-request.ts";

const ALLOWLIST_FILE = "tools/danger/legacy-allowlist.json";
// GitHub lists at most 3000 files per pull request: a larger diff cannot be scored
const MAX_LISTED_FILES = 3000;

// The workflow checks out the PR merge commit, so head files are on disk
function countLinesInCheckout(root: string): CountLines {
  return path => {
    try {
      const content = readFileSync(join(root, path), "utf8");
      return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
    } catch {
      return undefined;
    }
  };
}

function readAllowlist(root: string) {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(join(root, ALLOWLIST_FILE), "utf8"));
  } catch (error) {
    fail(`\`${ALLOWLIST_FILE}\` could not be read as JSON: ${error}`);
    return [];
  }
  const { entries, errors } = parseAllowlist(raw, path => existsSync(join(root, path)));
  for (const error of errors) fail(`\`${ALLOWLIST_FILE}\`: ${error}.`);
  return entries;
}

async function validateLegacyScore() {
  if (isMergeConflictsPr(danger.github.pr.title) || danger.github.pr.user.type === "Bot") return;
  try {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    const allowlist = readAllowlist(root);
    const { owner, repo, number } = danger.github.thisPR;
    const files: ChangedFile[] = await danger.github.api.paginate(
      danger.github.api.pulls.listFiles,
      { owner, repo, pull_number: number, per_page: 100 },
    );
    if (files.length >= MAX_LISTED_FILES) return;
    const report = computeLegacyScore(files, countLinesInCheckout(root), allowlist);

    if (report.legacyRemoved >= THANKS_REMOVED) {
      message(`${report.legacyRemoved} lines removed from legacy areas, thanks! 🧹`);
    }
    const touchesAllowlist = report.areas.some(a => a.area === "allowlisted");
    const quiet = report.newLines + report.legacyGrowth < MIN_LINES || report.score > GREEN_ABOVE;
    if (quiet && !touchesAllowlist) return;

    if (!quiet && report.score < RED_BELOW) {
      const path = report.suggestedFolder ?? "<folder>/";
      fail(
        `Only ${Math.floor(report.score * 100)}% of the new code lands in the new architecture layers. Legacy growth: ${legacyGrowthRows(report)}. Move it out of \`libs/\` and app feature folders into \`shared/\`, \`domain/\` or \`features/\`. If the legacy code is intended, add an entry to \`${ALLOWLIST_FILE}\`, which \`@ledgerhq/platform\` owns and reviews, with the narrowest path that fits: \`{ "path": "${path}", "reason": "", "target": "features/...", "ticket": "LIVE-" }\`. See the details below.`,
      );
    }
    markdown(formatReport(report));
  } catch (error) {
    // A scoring failure must not block the PR
    console.warn("Could not compute the architecture score", error);
  }
}

export default validateLegacyScore;
