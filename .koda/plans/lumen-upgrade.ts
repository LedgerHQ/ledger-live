// Upgrades Lumen to latest and opens a draft PR (Lumen ADR 027). Owned by the Lumen team.
// @ts-nocheck: @cairn/plan is provided by Cairn at run time, not installed here
import { agent, allTools, inputsOf, literal, plan, retryShellSlot, task, variable } from "@cairn/plan";
import { z } from "zod";

// Lumen versions live in the pnpm catalog.
const lumenPackages = [
  "@ledgerhq/lumen-design-core",
  "@ledgerhq/lumen-lint-plugin",
  "@ledgerhq/lumen-ui-react",
  "@ledgerhq/lumen-ui-rnative",
  "@ledgerhq/lumen-utils-shared",
];
// The catalog bump touches every package that uses Lumen, so check all of them, not only the apps.
// nx.json sets no defaultBase, so the base is explicit. Uncommitted changes count as affected.
// Lint and typecheck hashes leave out external dependencies, so a cached result would predate the bump.
const verifyCommand =
  "git fetch --quiet origin develop && pnpm nx affected -t lint,typecheck --base=origin/develop --skip-nx-cache";

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
  description: "What the migrations leave for a human to decide, one item per entry, with the file paths. Empty when nothing.",
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
    `You upgrade the @ledgerhq/lumen-* packages in ledger-live.
Follow AGENTS.md and the skills it points to. Fix only what the migrations or failing checks require. Keep behavior and unrelated code unchanged.
Never edit pnpm-lock.yaml or pnpm-workspace.yaml by hand and never downgrade a Lumen package.`,
  )
  .tools(allTools())
  .limits({ maxTurns: 40, timeoutMinutes: 30 });

const recorder = agent("recorder")
  .prompt("You write the terminal result of the run. Do not edit files.")
  .tools("read")
  .limits({ maxTurns: 4, timeoutMinutes: 5 });

// One upgrade PR at a time: `createBranch` adds a unique suffix, so without this each run opens another PR.
const openPrExitCode = variable("openPrExitCode", z.number());
const openPr = variable("openPr", z.string(), {
  description: "The open upgrade PR as JSON, with its url and headRefName. Empty when none is open.",
});

// Exit 0: no open upgrade PR. Exit 1: the bot's PR is open (stdout is its JSON). Exit 2: `gh` failed.
// Exit 3: a person opened it or committed to it, so it gets a comment and is left alone.
const checkOpenPrTask = task("check-open-pr")
  .runs(
    [
      `n=$(gh pr list --state open --limit 1000 --json number,headRefName --jq '[.[] | select(.headRefName | startswith("chore/lumen-upgrade"))][0].number // empty') || exit 2`,
      '[ -z "$n" ] && exit 0',
      'gh pr view "$n" --json url,headRefName || exit 2',
      // Empty logins (unlinked co-authors) and the bot's own login, with or without `app/` and `[bot]`, aren't people.
      `owner=$(gh pr view "$n" --json author,commits --jq '(.author.login | ltrimstr("app/") | rtrimstr("[bot]")) as $bot | ([.commits[].authors[].login | select(. != null and . != "") | rtrimstr("[bot]") | select(. != $bot)] | unique | length) as $humans | if .author.is_bot and $humans == 0 then "bot" else "human" end') || exit 2`,
      '[ "$owner" = bot ] && exit 1',
      'gh pr comment "$n" --body "A newer Lumen release is out. People have committed to this branch, so the automated upgrade left it unchanged: the next release after this PR merges picks up the rest." || exit 2',
      "exit 3",
    ].join("\n"),
  )
  .continueOnError()
  .writes({ exit_code: openPrExitCode, stdout: openPr });

const reuseBranchTask = task("reuse-branch")
  .uses(upgrader)
  .message(
    `An upgrade PR is already open: its url and branch (headRefName) are in openPr. Update that PR instead of opening a new one.
Run git fetch, check out that branch, and merge origin/develop into it.
Then restore both pnpm-workspace.yaml and pnpm-lock.yaml from origin/develop (git checkout origin/develop -- pnpm-workspace.yaml pnpm-lock.yaml), whatever the conflicts: the frozen install needs them consistent, and the next steps redo the bump.`,
  )
  .with({ openPr });

const createBranchTask = task("create-branch")
  .uses(upgrader)
  .createBranch({ name: "chore/lumen-upgrade" });

const installTask = task("install").runs("pnpm install --frozen-lockfile");

// Sets each catalog entry to the latest published version, then updates the lockfile.
const bumpTask = task("bump").runs(
  [
    "set -e",
    `for pkg in ${lumenPackages.join(" ")}; do`,
    '  version=$(npm view "$pkg" version)',
    '  sed -i.bak -E "s|^(  \\"$pkg\\": ).*|\\1$version|" pnpm-workspace.yaml',
    "done",
    "rm pnpm-workspace.yaml.bak",
    "pnpm install --no-frozen-lockfile",
  ].join("\n"),
);

// Always `@latest`: the index only knows the releases published before the CLI version.
const migrationsCli = "npx --yes @ledgerhq/lumen-migrations@latest";

// The range starts at the versions the open upgrade PR already migrated to, or at develop's when there is none.
const migrateTask = task("migrate")
  .uses(upgrader)
  .message(
    `Apply the Lumen migrations for the upgrade range with the migrations CLI.
1. Get the previous version of each bumped @ledgerhq/lumen-* package: if openPr is set, from the open PR's branch (\`git show origin/<headRefName>:pnpm-workspace.yaml\`), as its migrations are already applied; otherwise from \`git show origin/develop:pnpm-workspace.yaml\`. The new version is in the working tree's pnpm-workspace.yaml.
2. For each of them, run \`${migrationsCli} list --package <name> --from <previous> --to <new> --json\`.
3. For each migration listed, run \`${migrationsCli} show <id>\` and follow it (Before → after, Decide).
4. For each package, run \`${migrationsCli} check --package <name> --from <previous> --to <new>\` from the repo root, so every package using Lumen is scanned. Exit code 1 means \`expect: none\` patterns still have hits: fix them and run it again. Hits listed as review are for a human: do not edit them.
5. Write what you cannot decide, and every review hit, as humanReview.`,
  )
  .with({ openPr })
  .writes(humanReview);

// Same steps as .github/workflows/renovate-sync-reusable.yml, which only covers Renovate branches.
// React Native's Podfile only reads `xcodebuild -version`, so a stub is enough: nothing is compiled.
const podLockfileTask = task("pod-lockfile").runs(
  [
    "set -e",
    "mise install ruby@3.3",
    'export PATH="$(mise where ruby@3.3)/bin:$PATH"',
    "cd apps/ledger-live-mobile",
    "bundle install --jobs 4",
    "mkdir -p /tmp/xcode-stub",
    "printf '#!/bin/sh\\necho \"Xcode 16.4\"\\necho \"Build version 16F6\"\\n' > /tmp/xcode-stub/xcodebuild",
    "chmod +x /tmp/xcode-stub/xcodebuild",
    'PATH="/tmp/xcode-stub:$PATH" bundle exec ruby scripts/pod-lockfile.rb',
  ].join("\n"),
);

const commitTask = task("commit").uses(upgrader).commit({ message: "chore(lumen): upgrade Lumen to latest" });

// The repo's Renovate script lists every package whose resolved dependencies changed, from the
// lockfile diff against develop. It reads committed files, so it runs after the commit.
const changesetScriptTask = task("changeset-script").runs(
  'node tools/scripts/renovate-changeset.mjs origin/develop lumen-upgrade "Upgrade Lumen to latest"',
);

const changesetTask = task("changeset")
  .uses(upgrader)
  .message(
    `.changeset/lumen-upgrade.md lists the packages whose dependencies changed. Add every other package whose source files the migrations or fixes changed (git diff origin/develop --stat), following .agents/skills/create-changeset/SKILL.md. Do not commit.`,
  );

const commitChangesetTask = task("commit-changeset")
  .uses(upgrader)
  .commit({ message: "chore(lumen): add the Lumen upgrade changeset" });

const pushTask = task("push").uses(upgrader).push();

const prBodyTemplate = `### 📝 Description

Automated Lumen upgrade to the latest versions, run by Koda from \`.koda/plans/lumen-upgrade.ts\`: bumps the pnpm catalog and applies the Lumen migrations in range. Checked with \`${verifyCommand}\`.

Test run of the Lumen upgrade pipeline. Review before merging.

### 👀 Needs a human

<humanReview>

### 🔗 Context

- **JIRA / GitHub issue**: DLS-1166
- **ADR** (if any): [ADR 027: Automated Lumen upgrades in consumer repos](https://ledgerhq.atlassian.net/wiki/spaces/DLS/pages/7689666642)`;

const prBodyTask = task("pr-body")
  .uses(recorder)
  .message(
    "Write prBody: the template with <humanReview> replaced by humanReview as a Markdown list, or by `Nothing.` when it is empty. Change nothing else.",
  )
  .with({ template: literal(prBodyTemplate), humanReview })
  .writes(prBody);

const createPrTask = task("create-pr")
  .uses(upgrader)
  .createPr({ title: inputs.pr.field("title"), body: prBody.field("body") })
  .writes({ url: prUrl });

// `createPr` has no labels option.
const labelsTask = task("labels")
  .uses(upgrader)
  .message(
    "If labels is not empty, add them to prUrl with `gh pr edit <prUrl> --add-label <label>`, one flag per label. Skip a label the repo doesn't have.",
  )
  .with({ prUrl, labels: inputs.pr.field("labels") });

// An updated PR keeps its title and labels, but its body must reflect this run's migrations.
const updatePrBodyTask = task("update-pr-body")
  .uses(upgrader)
  .message("Replace the body of the PR in openPr with prBody.body: write it to a file and run `gh pr edit <url> --body-file <file>`.")
  .with({ openPr, prBody });

const recordPrCreatedTask = task("record-pr-created")
  .uses(recorder)
  .message("Write the terminal result as pr-created, with a one-sentence summary and the pull request URL as prUrl.")
  .with({ prUrl, verify })
  .writes(result);

const recordPrUpdatedTask = task("record-pr-updated")
  .uses(recorder)
  .message("Write the terminal result as pr-created: the open PR in openPr was updated. Give a one-sentence summary and its url as prUrl.")
  .with({ openPr, verify })
  .writes(result);

const recordHumanCommitsTask = task("record-human-commits")
  .uses(recorder)
  .message("Write the terminal result as skipped: a person opened or committed to the open upgrade PR in openPr, so it was left unchanged.")
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
  .message("Write the terminal result as skipped: the upgrade changed nothing because Lumen is already up to date.")
  .writes(result);

const recordFailureTask = task("record-failure")
  .uses(recorder)
  .message("Write the terminal result as failed. Give the failing check from the verify output as the reason.")
  .with({ verify })
  .writes(result);

const upgrade = (b) =>
  b
    .do(reuseBranchTask, { when: openPrExitCode.eq(1) })
    .do(createBranchTask, { when: openPrExitCode.eq(0) })
    .do(installTask)
    .do(bumpTask)
    .do(checkChangesTask)
    .if(
      changesExitCode.eq(0),
      (c) =>
        c
          .do(migrateTask)
          .retryShell("verify", {
            max: 3,
            command: verifyCommand,
            fixer: (shellOutput) =>
              task("fix")
                .uses(upgrader)
                .message("Checks failed after the Lumen upgrade. Fix them.")
                .with({ stdout: shellOutput.field("stdout"), stderr: shellOutput.field("stderr") }),
          })
          .if(
            verify.field("exit_code").eq(0),
            (d) =>
              d
                .do(podLockfileTask)
                .do(commitTask)
                .do(changesetScriptTask)
                .do(changesetTask)
                .do(commitChangesetTask)
                .do(pushTask)
                .do(prBodyTask)
                .if(
                  openPrExitCode.eq(1),
                  (e) => e.do(updatePrBodyTask).do(recordPrUpdatedTask),
                  (e) => e.do(createPrTask).do(labelsTask).do(recordPrCreatedTask),
                ),
            (d) => d.do(recordFailureTask),
          ),
      (c) => c.do(recordUpToDateTask),
    );

export default plan("lumen-upgrade")
  .input(planInput.partial().required({ pr: true }))
  .do(checkOpenPrTask)
  .if(openPrExitCode.eq(3), (b) => b.do(recordHumanCommitsTask))
  .elseif(openPrExitCode.eq(2), (b) => b.do(recordLookupFailedTask))
  .else(upgrade);
