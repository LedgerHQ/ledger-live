/** This repo's settings for the generic Lumen upgrade plan (`.koda/plans/lumen-upgrade.ts`). */
export const settings = {
  baseBranch: "develop",
  branchPrefix: "chore/lumen-upgrade",
  commitMessage: "chore(lumen): upgrade Lumen to latest",
  prTitle: "chore(deps): upgrade Lumen",
  /** Added to the PR on top of Cairn's `cairn` label. */
  labels: [],
  agentGuidance:
    "Follow AGENTS.md and the skills it points to. When you change a package's source files, list that package in .changeset/lumen-upgrade-migrations.md, following .agents/skills/create-changeset/SKILL.md. .changeset/lumen-upgrade.md is generated: do not edit it.",
  /** Updates the lockfile and installs after the bump. */
  relockCommand: "pnpm install --no-frozen-lockfile",
  verifyCommand: "bash .koda/lumen/lint-changed.sh",
  /** Runs after the bump, before the migrations. Empty to skip. */
  afterBumpCommand: "bash .koda/lumen/pod-lockfile.sh",
  /** Runs after the commit; what it changes is committed too. Empty to skip. */
  afterCommitCommand:
    'node tools/scripts/renovate-changeset.mjs origin/develop lumen-upgrade "Upgrade Lumen to latest"',
};
