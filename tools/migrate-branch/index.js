#!/usr/bin/env node

const childProcess = require("child_process");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const chalk = require("chalk");
const { cleanupTasks, exit, execute } = require("./utils");

const argv = yargs(hideBin(process.argv))
  .option("target-branch", {
    alias: "onto",
    type: "string",
    description:
      "The name of the local branch to create or switch to.\nDefaults to the name of the branch to migrate.",
  })
  .usage(
    [
      chalk.bold("[migrate-branch] - Git branch migration tool"),
      "",
      "Migrates a git branch from an outdated ledger-live repository.",
      "",
      chalk.bold.yellow("Important: ") +
        "if a branch with the same name does not exist it will be created from HEAD. The current commit will be used as a starting point for the imported branch.",
      "",
      chalk.bold("Usage: ") +
        `migrate-branch [repository name without the organization prefix] [branch name]`,
      chalk.bold("Example: ") + `migrate-branch ledger-live-desktop my-branch`,
    ].join("\n")
  )
  .version(false)
  .wrap(100).argv;

const [remote, branch] = argv._;
const targetBranch =
  typeof argv.targetBranch === "string" ? argv.targetBranch : branch;

if (!remote || !branch) {
  console.error(
    [
      chalk.red.bold("[!] Missing one or more arguments."),
      "Type " + chalk.bold("migrate-branch --help") + " for more information.",
      "",
      chalk.bold("Usage: ") + `migrate-branch [remote name] [branch name]`,
      chalk.bold("Example: ") + `migrate-branch ledger-live-desktop develop`,
    ].join("\n")
  );
  exit(1);
}

console.log(chalk.bold(`> Checking if ${remote} is already set as a remote…`));

const remotes = execute("git", ["remote"]);
const remoteExists = remotes.split("\n").findIndex((r) => r === remote) >= 0;

if (!remoteExists) {
  console.log(chalk.bold("> Adding remote: ") + remote);
  execute("git", [
    "remote",
    "add",
    remote,
    `https://github.com/LedgerHQ/${remote}.git`,
  ]);
  cleanupTasks.push(() => {
    console.log(chalk.bold("> Removing remote: ") + remote);
    execute("git", ["remote", "remove", remote]);
  });
}

console.log(chalk.bold("> Fetching remote: ") + remote);
execute("git", ["fetch", "-n", "-q", remote]);

const branchExists =
  childProcess.spawnSync("git", [
    "show-ref",
    "--verify",
    "--quiet",
    `refs/heads/${targetBranch}`,
  ]).status === 0;

if (!branchExists) {
  console.log(chalk.bold(`> Creating branch ${targetBranch}`));
  execute("git", ["branch", targetBranch]);
  execute("git", ["switch", targetBranch]);
  execute("git", [
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    `init ${remote}:${branch}`,
  ]);
} else {
  console.log(chalk.bold(`> Switching to branch ${targetBranch}`));
  execute("git", ["switch", targetBranch]);
}

const results = childProcess.spawnSync(
  "git",
  ["merge", "-s", "subtree", `${remote}/${branch}`],
  {
    stdio: "inherit",
  }
);

if (results.error || results.status > 0) {
  console.error(chalk.bold.red("[!] Failed to merge automatically."));
  console.error(
    `If conflicts were found, solve and commit and then run ${chalk.bold(
      "git merge --continue"
    )} to resume.`
  );
  exit(2);
} else {
  console.log(chalk.bold.green(`> ✅ All Done!`));
  exit();
}
