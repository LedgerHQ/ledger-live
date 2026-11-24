// Upgrades Lumen to latest and opens a PR (Lumen ADR 027). Owned by the Lumen team.
// @ts-nocheck: @cairn/plan is provided by Cairn at run time, not installed here
import {
  agent,
  allTools,
  inputsOf,
  literal,
  plan,
  retryShellSlot,
  task,
  variable,
} from "@cairn/plan";
import { z } from "zod";

// Repo settings: the only part that differs between the repos that run this plan.
const repo = {
  name: "ledger-live",
  baseBranch: "develop",
  // `createBranch` appends a unique suffix.
  branchPrefix: "chore/lumen-upgrade",
  prTitle: "chore(deps): upgrade Lumen",
  bumpCommitMessage: "chore(lumen): upgrade Lumen to latest",
  changesetCommitMessage: "chore(lumen): add the Lumen upgrade changeset",
  agentGuidance: "Follow AGENTS.md and the skills it points to.",
  installCommand: "pnpm install --frozen-lockfile",
  // Updates the lockfile after the bump.
  relockCommand: "pnpm install --no-frozen-lockfile",
  // Runs after the relock, before the migrations. Empty to skip.
  // Same steps as .github/workflows/renovate-sync-reusable.yml. React Native's Podfile only reads
  // `xcodebuild -version`, so a stub is enough: nothing is compiled.
  afterBumpCommand: [
    "set -e",
    "mise install ruby@3.3",
    'export PATH="$(mise where ruby@3.3)/bin:$PATH"',
    "cd apps/ledger-live-mobile",
    "bundle install --jobs 4",
    "mkdir -p /tmp/xcode-stub",
    'printf \'#!/bin/sh\\necho "Xcode 16.4"\\necho "Build version 16F6"\\n\' > /tmp/xcode-stub/xcodebuild',
    "chmod +x /tmp/xcode-stub/xcodebuild",
    'PATH="/tmp/xcode-stub:$PATH" bundle exec ruby scripts/pod-lockfile.rb',
  ].join("\n"),
  // Lints the packages in $packages (package.json names, one per line). One command, run under `timeout`.
  // `lint` has no dependsOn here, so it builds nothing first.
  lintCommand:
    'env NX_DAEMON=false pnpm nx run-many -t lint --projects="$(echo $packages | tr " " ,)" --skip-nx-cache',
  // Runs after the bump commit. Empty to skip. The repo's Renovate script lists every package whose
  // resolved dependencies changed, from the lockfile diff.
  changesetCommand:
    'node tools/scripts/renovate-changeset.mjs origin/develop lumen-upgrade "Upgrade Lumen to latest"',
  // Empty when the repo has no changesets.
  changesetInstructions:
    ".changeset/lumen-upgrade.md lists the packages whose dependencies changed. Add every other package whose source files the migrations or fixes changed (git diff origin/develop --stat), following .agents/skills/create-changeset/SKILL.md.",
  prBodyTemplate: `### 📝 Description

Automated Lumen upgrade to the latest versions, run by Koda from \`.koda/plans/lumen-upgrade.ts\`: bumps Lumen and applies the Lumen migrations in range. Koda only linted the packages the upgrade changed: typecheck and tests run in this PR's CI.

Review before merging.

### 👀 Needs a human

<humanReview>

### 🔗 Context

- **JIRA / GitHub issue**: DLS-1166
- **ADR** (if any): [ADR 027: Automated Lumen upgrades in consumer repos](https://ledgerhq.atlassian.net/wiki/spaces/DLS/pages/7689666642)`,
};

// The rest of the plan is the same in every repo.

// Cairn has no timeout on shell tasks: a stalled command would hang the run.
const fetchBase = `GIT_TERMINAL_PROMPT=0 timeout 300 git fetch --quiet origin ${repo.baseBranch}`;

// Paths that are not package code: lockfiles, the catalog, release notes, Koda's own files.
const unlinted =
  "':!**/pnpm-lock.yaml' ':!**/yarn.lock' ':!**/package-lock.json' ':!pnpm-workspace.yaml' ':!**/Podfile.lock' ':!.changeset' ':!.koda'";

// Lints only the packages whose files differ from the base branch, lockfiles aside: the bump and the migrations.
// Typecheck and dependents build most of the repo first, so they are left to the PR's CI.
const verifyCommand = [
  "set -eo pipefail",
  fetchBase,
  // The root is a package to lint in a single-package repo, or when the workspace lists it ("."). Otherwise it holds no source.
  `root=.; if grep -qsE '^packages:' pnpm-workspace.yaml || grep -qs '"workspaces"' package.json; then root=; fi`,
  "if grep -qsE '^ *- *.?[.].? *$' pnpm-workspace.yaml; then root=.; fi",
  // Untracked files count too: the check runs before the commit, and a migration can add a file.
  `packages=$({ git diff --name-only FETCH_HEAD -- . ${unlinted}; git ls-files --others --exclude-standard -- . ${unlinted}; } | while read -r file; do`,
  '  dir=$(dirname "$file")',
  '  while [ "$dir" != . ] && [ ! -f "$dir/package.json" ]; do dir=$(dirname "$dir"); done',
  '  if [ -f "$dir/package.json" ] && { [ "$dir" != . ] || [ "$root" = . ]; }; then node -p "require(\'./$dir/package.json\').name"; fi',
  "done | sort -u)",
  'if [ -z "$packages" ]; then echo "No package changed besides the lockfiles."; exit 0; fi',
  // `timeout` runs lintCommand as a program: a leading `cd` or `VAR=value` needs `sh -c '...'` or `env`.
  `timeout 1200 ${repo.lintCommand}`,
].join("\n");

// What the Lumen workflow sends. The plan bumps to latest and doesn't read targetVersions yet.
const planInput = z.object({
  targetVersions: z.record(z.string(), z.string()),
  pr: z.object({ title: z.string(), labels: z.array(z.string()) }),
  changeset: z.boolean(),
  upstreamPackages: z.array(z.object({ package: z.string(), repo: z.string() })),
});
const inputs = inputsOf(planInput);

const prUrl = variable("prUrl", z.string().url(), {
  description: "Pull request URL opened by the upgrade.",
});

const humanReview = variable("humanReview", z.array(z.string()), {
  description:
    "What the migrations leave for a human to decide, one item per entry, with the file paths. Empty when nothing.",
});

const prBody = variable("prBody", z.object({ body: z.string() }), {
  description: "The pull request body, in Markdown.",
});

const result = variable(
  "result",
  z.discriminatedUnion("status", [
    z.object({
      status: z.literal("pr-created"),
      summary: z.string().describe("What the upgrade changed."),
      prUrl: z.string().url(),
    }),
    z.object({
      status: z.literal("skipped"),
      reason: z.string().describe("Why no PR was opened."),
    }),
    z.object({
      status: z.literal("failed"),
      reason: z.string().describe("The failing step."),
    }),
  ]),
  { description: "Terminal result returned by run-plan." },
);

const verify = retryShellSlot("verify");

const upgrader = agent("upgrader")
  .prompt(
    `You upgrade the @ledgerhq/lumen-* packages in ${repo.name}.
${repo.agentGuidance} Fix only what the migrations or failing checks require. Keep behavior and unrelated code unchanged.
Never edit lockfiles by hand and never downgrade a Lumen package. Keep peerDependencies ranges unless the new version falls outside them.`,
  )
  .tools(allTools())
  .limits({ maxTurns: 40, timeoutMinutes: 30 });

const recorder = agent("recorder")
  .prompt("You write the terminal result of the run. Do not edit files.")
  .tools("read")
  .limits({ maxTurns: 4, timeoutMinutes: 5 });

// Koda opens PRs as its GitHub app, but its commits are authored by this account.
const kodaCommitters = ["ldg-github-ci"];

// Prints "bot" when the bot opened the PR and only the bot committed to it, "human" otherwise. The bot's own login
// (with or without `app/` and `[bot]`) and the accounts Koda commits as aren't people. An author with no GitHub login
// (an email not linked to an account) is counted as a person: it can't be told apart from one.
const ownerJq = `(.author.login | ltrimstr("app/") | rtrimstr("[bot]")) as $bot | ([.commits[].authors[] | (.login // "") | rtrimstr("[bot]") | select(. != $bot) | ${kodaCommitters.map(login => `select(. != "${login}")`).join(" | ")}] | unique | length) as $humans | if .author.is_bot and $humans == 0 then "bot" else "human" end`;

// The bot PRs this run replaces, one "<number> <head commit>" per line, kept in .git so it is never committed.
const oldPrFile = ".git/lumen-old-upgrade-pr";

// One upgrade PR at a time: `createBranch` adds a unique suffix, so without this each run opens another PR.
const openPrExitCode = variable("openPrExitCode", z.number());
const openPr = variable("openPr", z.string(), {
  description:
    "The open upgrade PRs as JSON, with their url and headRefName: the bot's PRs this run replaces, or the PR a person committed to. Empty when none is open.",
});

// The open upgrade PRs, as a jq filter over `gh pr list --json number,url,headRefName`.
const upgradePrsJq = `[.[] | select(.headRefName | startswith("${repo.branchPrefix}"))]`;
const listOpenPrs = "gh pr list --state open --limit 1000 --json number,url,headRefName --jq";

// Every open upgrade PR is checked, not only the first: one a person committed to stops the run, even when a newer
// bot PR is open too.
// Exit 0: no open upgrade PR. Exit 1: only the bot's PRs are open (stdout is their JSON), so the new PR replaces them.
// Exit 2: `gh` failed. Exit 3: a person opened one or committed to it (stdout is its JSON): it gets a comment and the
// run stops.
const checkOpenPrTask = task("check-open-pr")
  .runs(
    [
      `prs=$(${listOpenPrs} '${upgradePrsJq} | .[].number') || exit 2`,
      '[ -z "$prs" ] && exit 0',
      `: > ${oldPrFile}`,
      "for n in $prs; do",
      `  owner=$(gh pr view "$n" --json author,commits --jq '${ownerJq}') || exit 2`,
      '  if [ "$owner" != bot ]; then',
      '    gh pr view "$n" --json url,headRefName || exit 2',
      '    gh pr comment "$n" --body "A newer Lumen release is out. People have committed to this branch, so the automated upgrade left it unchanged: the next release after this PR merges picks up the rest." || exit 2',
      "    exit 3",
      "  fi",
      `  gh pr view "$n" --json number,headRefOid --jq '"\\(.number) \\(.headRefOid)"' >> ${oldPrFile} || exit 2`,
      "done",
      `${listOpenPrs} '${upgradePrsJq}' || exit 2`,
      "exit 1",
    ].join("\n"),
  )
  .continueOnError()
  .writes({ exit_code: openPrExitCode, stdout: openPr });

// Replacing the bot's PR instead of updating it keeps every run a full upgrade from the base branch:
// code merged since then gets every migration in range. Someone may have pushed to it during the run, so it is closed
// and its branch deleted only if it is still open, still the bot's alone and still at the commit checked at the start.
// Each one is handled on its own: a failure on one doesn't stop the others.
const closeOldPrTask = task("close-old-pr")
  .runs(
    [
      "new=$(gh pr view --json url --jq .url)",
      "while read -r n sha; do",
      `  now=$(gh pr view "$n" --json state,headRefOid,author,commits --jq '.state + " " + .headRefOid + " " + (${ownerJq})')`,
      '  if [ "$now" = "OPEN $sha bot" ]; then',
      '    gh pr close "$n" --delete-branch --comment "Superseded by $new."',
      '  elif [ "${now%% *}" = OPEN ]; then',
      '    gh pr comment "$n" --body "Superseded by $new. This branch changed during the upgrade run, so it was left open: close it once its changes are handled."',
      "  fi",
      `done < ${oldPrFile}`,
    ].join("\n"),
  )
  .continueOnError();

const createBranchTask = task("create-branch")
  .uses(upgrader)
  .createBranch({ name: repo.branchPrefix });

// The sandbox image can ship a checkout whose base branch is as old as the image, and Cairn fetches the branch by URL,
// which leaves it there: the migration range and the changesets read the base branch, so refresh it first.
const installTask = task("install").runs(`${fetchBase} && ${repo.installCommand}`);

// Moves every Lumen version to the latest published one, keeping its `^` or `~`: exact versions and ranges
// in dependencies, devDependencies and optionalDependencies of each package.json, and pnpm catalog entries in
// pnpm-workspace.yaml (quoted or not). A range's floor is the installed version, so moving it moves the install.
// peerDependencies are left alone (they say what a library accepts), and so is a version newer than `latest`
// (dist-tag rollback, prerelease). Edits the text in place, so the files keep their formatting.
const bumpScript = String.raw`
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const version = /^([\^~]?)(\d+)\.(\d+)\.(\d+)(\S*)$/;
const isNewer = (next, current) => {
  const a = next.match(version);
  const b = current.match(version);
  if (!a || !b || a[5] || b[5]) return false;
  for (let i = 2; i <= 4; i++) if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  return false;
};
const latest = {};
const latestOf = name => (latest[name] ??= execSync("npm view " + name + " version").toString().trim());
const bumped = (name, spec) => {
  const m = spec.match(version);
  if (!m) return spec;
  const next = latestOf(name);
  return isNewer(next, spec.slice(m[1].length)) ? m[1] + next : spec;
};
const changes = [];
const manifests = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === "package.json") manifests.push(file);
  }
};
walk(".");
for (const file of manifests) {
  let text = fs.readFileSync(file, "utf8");
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const open = text.match(new RegExp('"' + field + '"\\s*:\\s*\\{'));
    if (!open) continue;
    const from = open.index + open[0].length;
    const to = text.indexOf("}", from);
    const block = text.slice(from, to).replace(/("(@ledgerhq\/lumen-[a-z-]+)"\s*:\s*")([^"]+)"/g, (all, head, name, spec) => {
      const next = bumped(name, spec);
      if (next !== spec) changes.push(file + " " + name + " " + spec + " -> " + next);
      return head + next + '"';
    });
    text = text.slice(0, from) + block + text.slice(to);
  }
  fs.writeFileSync(file, text);
}
if (fs.existsSync("pnpm-workspace.yaml")) {
  const entry = /^(\s+["']?(@ledgerhq\/lumen-[a-z-]+)["']?\s*:\s*["']?)([^"'\s#]+)(.*)$/;
  const lines = fs.readFileSync("pnpm-workspace.yaml", "utf8").split("\n").map(line => {
    const m = line.match(entry);
    if (!m) return line;
    const next = bumped(m[2], m[3]);
    if (next !== m[3]) changes.push("pnpm-workspace.yaml " + m[2] + " " + m[3] + " -> " + next);
    return m[1] + next + m[4];
  });
  fs.writeFileSync("pnpm-workspace.yaml", lines.join("\n"));
}
console.log(changes.length ? changes.join("\n") : "No Lumen version to move.");
`;

const bumpTask = task("bump").runs(
  ["set -e", `node - <<'NODE'\n${bumpScript}\nNODE`, repo.relockCommand].join("\n"),
);

const afterBumpTask = task("after-bump").runs(repo.afterBumpCommand);

// Always `@latest`: the index only knows the releases published before the CLI version.
const migrationsCli = "npx --yes @ledgerhq/lumen-migrations@latest";

const migrateTask = task("migrate")
  .uses(upgrader)
  .message(
    `Apply the Lumen migrations for the upgrade range with the migrations CLI.
1. Get the previous version of each bumped @ledgerhq/lumen-* package from origin/${repo.baseBranch}: from the package.json files that declare it, or from the pnpm catalog in pnpm-workspace.yaml (\`git show origin/${repo.baseBranch}:<path>\`), without a leading ^ or ~. The new version is in the working tree, the same way. When files declare different previous versions, use the lowest.
2. For each of them, run \`${migrationsCli} list --package <name> --from <previous> --to <new> --json\`.
3. For each migration listed, run \`${migrationsCli} show <id>\` and follow it (Before → after, Decide).
4. For each package, run \`${migrationsCli} check --package <name> --from <previous> --to <new>\` from the repo root, so every package using Lumen is scanned. Exit code 1 means \`expect: none\` patterns still have hits: fix them and run it again. Hits listed as review are for a human: do not edit them.
5. Write what you cannot decide, and every review hit, as humanReview.`,
  )
  .writes(humanReview);

const commitTask = task("commit").uses(upgrader).commit({ message: repo.bumpCommitMessage });

// Reads committed files, so it runs after the commit.
const changesetScriptTask = task("changeset-script").runs(repo.changesetCommand);

const changesetTask = task("changeset")
  .uses(upgrader)
  .message(`${repo.changesetInstructions} Do not commit.`);

// The changeset step can have nothing to add, and a commit with nothing staged would fail.
const changesetExitCode = variable("changesetExitCode", z.number());
const checkChangesetTask = task("check-changeset")
  .runs('test -n "$(git status --porcelain)"')
  .continueOnError()
  .writes({ exit_code: changesetExitCode });

const commitChangesetTask = task("commit-changeset")
  .uses(upgrader)
  .commit({ message: repo.changesetCommitMessage });

const pushTask = task("push").uses(upgrader).push();

const prBodyTask = task("pr-body")
  .uses(recorder)
  .message(
    "Write prBody: the template with <humanReview> replaced by humanReview as a Markdown list, or by `Nothing.` when it is empty. Change nothing else.",
  )
  .with({ template: literal(repo.prBodyTemplate), humanReview })
  .writes(prBody);

const createPrTask = task("create-pr")
  .uses(upgrader)
  .createPr({ title: repo.prTitle, body: prBody.field("body") })
  .writes({ url: prUrl });

// `createPr` has no labels option.
const labelsTask = task("labels")
  .uses(upgrader)
  .message(
    "If pr.labels is not empty, add them to prUrl with `gh pr edit <prUrl> --add-label <label>`, one flag per label. Skip a label the repo doesn't have.",
  )
  .with({ prUrl, pr: inputs.pr });

const recordPrCreatedTask = task("record-pr-created")
  .uses(recorder)
  .message(
    "Write the terminal result as pr-created, with a one-sentence summary and the pull request URL as prUrl.",
  )
  .with({ prUrl, verify })
  .writes(result);

const recordHumanCommitsTask = task("record-human-commits")
  .uses(recorder)
  .message(
    "Write the terminal result as skipped: a person opened or committed to the open upgrade PR in openPr, so it was left unchanged.",
  )
  .with({ openPr })
  .writes(result);

const recordLookupFailedTask = task("record-lookup-failed")
  .uses(recorder)
  .message("Write the terminal result as failed: looking up the open upgrade PR with gh failed.")
  .with({ openPr })
  .writes(result);

// Nothing to commit when Lumen was already at the latest version.
const changesExitCode = variable("changesExitCode", z.number());
const checkChangesTask = task("check-changes")
  .runs('test -n "$(git status --porcelain)"')
  .continueOnError()
  .writes({ exit_code: changesExitCode });

const recordUpToDateTask = task("record-up-to-date")
  .uses(recorder)
  .message(
    "Write the terminal result as skipped: the upgrade changed nothing because Lumen is already up to date.",
  )
  .writes(result);

const recordFailureTask = task("record-failure")
  .uses(recorder)
  .message(
    "Write the terminal result as failed. Give the failing check from the verify output as the reason.",
  )
  .with({ verify })
  .writes(result);

const fixTask = shellOutput =>
  task("fix")
    .uses(upgrader)
    .message("Checks failed after the Lumen upgrade. Fix them.")
    .with({ stdout: shellOutput.field("stdout"), stderr: shellOutput.field("stderr") });

// Steps whose setting is empty are left out of the plan.
const migrate = b => {
  const bumped = repo.afterBumpCommand ? b.do(afterBumpTask) : b;
  return bumped
    .do(migrateTask)
    .retryShell("verify", { max: 3, command: verifyCommand, fixer: fixTask });
};

const commit = b => {
  const committed = b.do(commitTask);
  const listed = repo.changesetCommand ? committed.do(changesetScriptTask) : committed;
  return repo.changesetInstructions
    ? listed
        .do(changesetTask)
        .do(checkChangesetTask)
        .do(commitChangesetTask, { when: changesetExitCode.eq(0) })
    : listed;
};

const openPrSteps = b =>
  b
    .do(pushTask)
    .do(prBodyTask)
    .do(createPrTask)
    .do(labelsTask)
    .do(closeOldPrTask, { when: openPrExitCode.eq(1) })
    .do(recordPrCreatedTask);

const upgrade = b =>
  b
    .do(createBranchTask)
    .do(installTask)
    .do(bumpTask)
    .do(checkChangesTask)
    .if(
      changesExitCode.eq(0),
      c =>
        migrate(c).if(
          verify.field("exit_code").eq(0),
          d => openPrSteps(commit(d)),
          d => d.do(recordFailureTask),
        ),
      c => c.do(recordUpToDateTask),
    );

export default plan("lumen-upgrade")
  .input(planInput.partial().required({ pr: true }))
  .do(checkOpenPrTask)
  .if(openPrExitCode.eq(3), b => b.do(recordHumanCommitsTask))
  .elseif(openPrExitCode.eq(2), b => b.do(recordLookupFailedTask))
  .else(upgrade);
