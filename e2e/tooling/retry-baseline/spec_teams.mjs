// Maps each mobile spec (path relative to e2e/mobile) to its owning team slugs, as JSON on stdout.
// Deleted specs still run on older branches, so they are added from git history, marked "(spec removed)".
// Usage: node spec_teams.mjs > spec_teams.json
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildTeamIndex, teamSlug } from "../filter/teamSpecs.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const mobileRoot = path.join(repoRoot, "e2e/mobile");
const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" });

const teamsBySpec = {};
const currentSpecs = git("ls-files", "e2e/mobile/specs/*.spec.ts")
  .split("\n")
  .filter(Boolean)
  .map(file => path.join(repoRoot, file));
for (const [team, specs] of buildTeamIndex(currentSpecs)) {
  for (const spec of specs) (teamsBySpec[path.relative(mobileRoot, spec)] ??= []).push(team);
}

const deletions = git(
  "log",
  "--no-renames",
  "--diff-filter=D",
  "--format=@%h",
  "--name-only",
  "--",
  "e2e/mobile/specs",
);
let commit;
for (const line of deletions.split("\n").filter(Boolean)) {
  if (line.startsWith("@")) {
    commit = line.slice(1);
    continue;
  }
  const spec = path.relative(mobileRoot, path.join(repoRoot, line));
  if (!line.endsWith(".spec.ts") || teamsBySpec[spec]) continue;
  const source = git("show", `${commit}^:${line}`);
  const teams = [
    ...new Set([...source.matchAll(/\bTeam\.([A-Z][A-Z0-9_]*)\b/g)].map(m => teamSlug(m[1]))),
  ];
  teamsBySpec[spec] = (teams.length ? teams.sort() : ["?"]).map(team => `${team} (spec removed)`);
}

console.log(JSON.stringify(teamsBySpec));
