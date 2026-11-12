import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findPatchBumps, isChangesetFile } from "../changesets.ts";
import { isMergeConflictsPr } from "../pull-request.ts";

const SKILL_URL =
  "https://github.com/LedgerHQ/ledger-live/blob/develop/.agents/skills/create-changeset/SKILL.md";

const listPackages = (packages: string[]): string => packages.map(name => `\`${name}\``).join(", ");

// The workflow checks out the PR merge commit, so head files are on disk
function readChangesets(paths: string[]) {
  const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  return paths.map(path => ({ path, content: readFileSync(join(root, path), "utf8") }));
}

async function validateChangesets() {
  if (isMergeConflictsPr(danger.github.pr.title)) return;

  const changesetPaths: string[] = [
    ...danger.git.created_files,
    ...danger.git.modified_files,
  ].filter(isChangesetFile);
  if (!changesetPaths.length) return;

  for (const { path, packages } of findPatchBumps(readChangesets(changesetPaths))) {
    fail(
      `\`${path}\` bumps ${listPackages(packages)} as \`patch\`. On \`develop\` the level is at least \`minor\`; \`patch\` is only for a pull request to a hotfix branch. See the [create-changeset skill](${SKILL_URL}).`,
    );
  }
}

export default validateChangesets;
