const childProcess = require("child_process");
const chalk = require("chalk");

const cleanupTasks = [];
function exit(code = 0) {
  if (cleanupTasks.length > 0) {
    console.log(chalk.bold(`> Cleaning up…`));
    cleanupTasks.forEach((task) => {
      task();
    });
  }
  process.exit(code);
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
    exit(2);
  }
  return results.stdout.toString();
}

module.exports = {
  cleanupTasks,
  exit,
  execute,
};
