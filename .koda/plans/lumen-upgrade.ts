// @ts-nocheck
/**
 * Upgrades Lumen to latest (Lumen ADR 027). Continues the open upgrade PR when there is one:
 * rebases it on the base branch, then bumps and migrates again. Opens a new PR otherwise.
 * Repo specifics live in `.koda/lumen/settings.ts` and `.koda/lumen/pull-request.ts`.
 */
import { agent, allTools, literal, plan, task, variable } from "@cairn/plan";
import { z } from "zod";
import { pullRequest } from "../lumen/pull-request.ts";
import { settings } from "../lumen/settings.ts";

const openBranch = variable("openBranch", z.string(), {
  description: "Branch of the open upgrade PR this run continues. Empty when a new PR is opened.",
});
const versions = variable("versions", z.string(), {
  description: "Diff of the Lumen versions between the base branch and the working tree.",
});
const prBody = variable("prBody", z.object({ body: z.string() }), {
  description: "The pull request body, in Markdown.",
});
const prUrl = variable("prUrl", z.string().url(), { description: "The upgrade PR's URL." });
const changesExitCode = variable("changesExitCode", z.number());
const result = variable(
  "result",
  z.discriminatedUnion("status", [
    z.object({
      status: z.enum(["pr-created", "pr-updated"]),
      summary: z.string().describe("What the upgrade changed."),
      prUrl: z.string().url(),
    }),
    z.object({
      status: z.literal("skipped"),
      reason: z.string().describe("Why nothing was pushed."),
    }),
  ]),
  { description: "Terminal result returned by run-plan." },
);

const upgrader = agent("upgrader")
  .prompt(
    `You upgrade the @ledgerhq/lumen-* packages in this repository. ${settings.agentGuidance}
Fix only what the migrations, conflicts or failing checks require. Keep behavior and unrelated code unchanged.
Never edit lockfiles by hand and never downgrade a Lumen package. Keep peerDependencies ranges unless the new version falls outside them.`,
  )
  .tools(allTools())
  .limits({ maxTurns: 40, timeoutMinutes: 30 });

const recorder = agent("recorder")
  .prompt("You write the terminal result of the run. Do not edit files.")
  .tools("read")
  .limits({ maxTurns: 4, timeoutMinutes: 5 });

/** A recorder task that writes the terminal result. */
const record = (name, message, context) => {
  const recordTask = task(name).uses(recorder).message(message);
  return (context ? recordTask.with(context) : recordTask).writes(result);
};

/** Checks out the newest open upgrade PR's branch and prints its name; prints nothing when none. */
const checkoutOpenPrTask = task("checkout-open-pr")
  .runs(
    `set -eo pipefail
branch=$(gh pr list --state open --author app/koda-apps --json headRefName --jq '[.[].headRefName | select(startswith("${settings.branchPrefix}"))][0] // ""')
if [ -n "$branch" ]; then
  GIT_TERMINAL_PROMPT=0 timeout 300 git fetch --quiet origin "$branch:refs/remotes/origin/$branch"
  git checkout --quiet -B "$branch" "origin/$branch"
fi
printf %s "$branch"`,
  )
  .writes({ stdout: openBranch });

const createBranchTask = task("create-branch")
  .uses(upgrader)
  .createBranch({ name: settings.branchPrefix });

/** Fails while a rebase is in progress, so the resolver runs until the rebase is done. */
const rebaseCommand = `set -e
test ! -d .git/rebase-merge
test ! -d .git/rebase-apply
GIT_TERMINAL_PROMPT=0 timeout 300 git fetch --quiet origin "+${settings.baseBranch}:refs/remotes/origin/${settings.baseBranch}"
git rebase origin/${settings.baseBranch}`;

const resolveConflictsTask = shellOutput =>
  task("resolve-conflicts")
    .uses(upgrader)
    .message(
      `The rebase on origin/${settings.baseBranch} stopped on conflicts. Resolve them, \`git add\` the files and run \`GIT_EDITOR=true git rebase --continue\`, until the rebase is done.
- Lockfiles: take origin/${settings.baseBranch}'s version (\`git checkout --ours <file>\`). The bump regenerates them.
- Code: keep the changes from origin/${settings.baseBranch}, adapted to the Lumen API this branch upgrades to.`,
    )
    .with({ stdout: shellOutput.field("stdout"), stderr: shellOutput.field("stderr") });

const bumpTask = task("bump").runs(
  `set -e\nnode .koda/lumen/bump.mjs\n${settings.relockCommand}\n${settings.afterBumpCommand}`,
);

/** Exit code 0 when the branch differs from the open PR, or from the base branch when there is none. */
const checkChangesTask = task("check-changes")
  .runs(
    'test -n "$(git diff --name-only "origin/$(git branch --show-current)" 2>/dev/null || git diff --name-only HEAD)"',
  )
  .continueOnError()
  .writes({ exit_code: changesExitCode });

/** Every Lumen version line that differs from the base branch, wherever the manifests are. */
const versionsTask = task("versions")
  .runs(
    `git diff -U0 -G'@ledgerhq/lumen-' origin/${settings.baseBranch} -- '*package.json' pnpm-workspace.yaml`,
  )
  .writes({ stdout: versions });

/** Always `@latest`: the index only knows releases published before the CLI version. */
const migrationsCli = "npx --yes @ledgerhq/lumen-migrations@latest";

const migrateTask = task("migrate")
  .uses(upgrader)
  .message(
    `Apply the Lumen migrations for this upgrade with the migrations CLI. In versions, \`-\` lines hold each @ledgerhq/lumen-* package's previous version and \`+\` lines its new one. Drop any leading ^ or ~, and when files disagree, use the lowest previous version.
1. For each package, run \`${migrationsCli} list --package <name> --from <previous> --to <new> --json\`.
2. For each migration listed, run \`${migrationsCli} show <id>\` and follow it (Before → after, Decide). A previous run on this branch may have applied some already: leave those as they are.
3. For each package, run \`${migrationsCli} check --package <name> --from <previous> --to <new>\` from the repo root, so every package using Lumen is scanned. Exit code 1 means \`expect: none\` patterns still have hits: fix them and run it again. Hits listed as review are for a human: do not edit them.
4. Write prBody: the template with <humanReview> replaced by a Markdown list of what you could not decide and every review hit, with the file paths, or by \`Nothing.\` when there is none. Change nothing else.`,
  )
  .with({ versions, template: literal(pullRequest.body) })
  .writes(prBody);

const fixChecksTask = shellOutput =>
  task("fix")
    .uses(upgrader)
    .message("Checks failed after the Lumen upgrade. Fix them.")
    .with({ stdout: shellOutput.field("stdout"), stderr: shellOutput.field("stderr") });

/** Cairn's `commit()` fails on a clean tree, and a rebase alone leaves nothing to commit. */
const commitIfChanged = `git add -A\ngit diff --cached --quiet || git commit --quiet -m "${settings.commitMessage}"`;
const commitTask = task("commit").runs(commitIfChanged);

/** For repo tools that read committed files, like a changeset generator. Commits what they change. */
const afterCommitTask = task("after-commit").runs(
  `set -e\n${settings.afterCommitCommand}\n${commitIfChanged}`,
);

/** Cairn's `push()` never forces, and a rebased branch needs it. The lease keeps others' pushes. */
const pushTask = task("push").runs("git push --quiet --force-with-lease -u origin HEAD");

/** Opens the PR, or returns the branch's open one. */
const createPrTask = task("create-pr")
  .uses(upgrader)
  .createPr({ title: pullRequest.title, body: prBody.field("body") })
  .writes({ url: prUrl });

const labelFlags = settings.labels.map(label => `--add-label "${label}"`).join(" ");
const labelsTask = task("labels").runs(labelFlags ? `gh pr edit ${labelFlags}` : "true");

/** `createPr` leaves an existing PR's body as it was. */
const updatePrBodyTask = task("update-pr-body")
  .uses(upgrader)
  .message("Replace prUrl's body with prBody.body, using `gh pr edit <prUrl> --body-file`.")
  .with({ prUrl, prBody });

const recordPrTask = record(
  "record-pr",
  "Write the terminal result as pr-created when openBranch is empty, pr-updated otherwise, with a one-sentence summary and prUrl.",
  { openBranch, prUrl },
);
const recordUpToDateTask = record(
  "record-up-to-date",
  "Write the terminal result as skipped: the branch is already up to date with the base branch and the latest Lumen.",
);

const migrateAndPublish = b =>
  b
    .do(versionsTask)
    .do(migrateTask)
    .retryShell("verify", {
      max: 3,
      command: settings.verifyCommand,
      fixer: fixChecksTask,
      onMaxIterations: "panic",
    })
    .do(commitTask)
    .do(afterCommitTask)
    .do(pushTask)
    .do(createPrTask)
    .do(labelsTask)
    .do(updatePrBodyTask, { when: openBranch.ne("") })
    .do(recordPrTask);

/** Cairn requires an input schema; the plan takes no input. */
export default plan("lumen-upgrade")
  .input(z.object({}))
  .do(checkoutOpenPrTask)
  .do(createBranchTask, { when: openBranch.eq("") })
  .retryShell("rebase", {
    max: 3,
    command: rebaseCommand,
    fixer: resolveConflictsTask,
    onMaxIterations: "panic",
  })
  .do(bumpTask)
  .do(checkChangesTask)
  .if(changesExitCode.eq(0), migrateAndPublish)
  .else(b => b.do(recordUpToDateTask));
