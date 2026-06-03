const fs = require("fs");
const { GitHubActionsReporter } = require("@jest/reporters");

// jest-quiet-reporter wraps process.stderr.write at construction time and
// silently drops every chunk that passes through it. fs.writeSync(2, …)
// bypasses Node's process.stderr Writable wrapper and writes directly to the
// stderr file descriptor, so the GitHub Actions workflow commands actually
// reach the runner log.
class GitHubActionsReporterFd extends GitHubActionsReporter {
  log(message) {
    fs.writeSync(2, `${message}\n`);
  }
}

module.exports = GitHubActionsReporterFd;
