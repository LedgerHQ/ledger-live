#!/usr/bin/env node
const chalk = require("chalk");
const childProcess = require("child_process");

const [, , remote, branch] = process.argv;

if (process.argv.indexOf("--help") > -1) {
  console.log(chalk.bold("---------------------"));
  console.log(chalk.bold("Branch migration tool"));
  console.log(chalk.bold("---------------------"));
  console.log("");
  console.log(
    "Migrates a branch from an LedgerHQ organization repository to the current repository."
  );
  console.log(
    chalk.bold.yellow("Important: ") +
      "The imported branch will be forked from the current git location."
  );
  console.log("");
  console.log(
    chalk.bold("Usage: ") +
      `pnpm migrate-branch [repository name (without the org prefix)] [branch name]`
  );
  console.log(
    chalk.bold("Example: ") +
      `pnpm migrate-branch ledger-live-desktop my-branch`
  );
  process.exit(0);
}

const cleanupTasks = [];
function onExit() {
  if (cleanupTasks.length > 0) {
    console.log(chalk.bold(`> Cleaning up…`));
    cleanupTasks.forEach((task) => {
      task();
    });
  }
}

function execute(command, args = [], options = {}) {
  const results = childProcess.spawnSync(command, args, options);
  if (results.error || results.status > 0) {
    console.error(
      chalk.red.bold(`[!] Error while running: ${command} ${args.join(" ")}`)
    );
    console.error(
      chalk.red(
        results.output
          .map((buffer) => buffer && buffer.toString())
          .filter(Boolean)
          .join("\n")
      )
    );
    onExit();
    process.exit(2);
  }
  return results.stdout.toString();
}

if (!remote || !branch) {
  console.error(
    [
      chalk.red.bold("[!] Missing one or more arguments."),
      chalk.bold("Usage: ") + `migrate-branch [remote name] [branch name]`,
      chalk.bold("Example: ") + `migrate-branch ledger-live-desktop develop`,
    ].join("\n")
  );
  process.exit(1);
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
  execute("git", ["fetch", "-n", "-q", remote]);
}

const result = childProcess.spawnSync("git", [
  "show-ref",
  "--verify",
  "--quiet",
  `refs/heads/${branch}`,
]);

const branchExists = result.status === 0;

if (!branchExists) {
  console.log(chalk.bold(`> Creating branch ${branch}`));
  execute("git", ["branch", branch]);
  execute("git", ["switch", branch]);
  execute("git", [
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    `init ${remote}:${branch}`,
  ]);
} else {
  console.log(chalk.bold(`> Switching to branch ${branch}`));
  execute("git", ["switch", branch]);
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
  onExit();
  process.exit(2);
} else {
  console.log(chalk.bold.green(`> ✅ All Done!`));
  onExit();
}
