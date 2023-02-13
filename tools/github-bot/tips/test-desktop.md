## 💡 Basics Tips

##### To share some piece of advice and help the community, please do not hesitate to [edit this file](https://github.com/LedgerHQ/ledger-live/edit/develop/tools/github-bot/tips/test-desktop.md) and submit a pull request. Thank you! 🙏

If you're troubleshooting a build failure, here are a few tips to keep in mind.

_Note: you should always navigate to the workflow run page linked above to get additional information about the build failure._

### ⚠️ Read the logs ⚠️

#### Start by carefully reading the logs. In most cases (99% of the time), this will be enough to understand the cause of the failure.

### Determine if the failure is os-specific

LLD is tested on Linux, macOS, and Windows, and some errors may only occur on a single platform.

### Identify the specific step where the error occurred

The LLD test process consists of the following actions that are performed (in a nutshell):

- **Unit testing**
  - Checkout the repository. ℹ️ For pull requests, it does a checkout of the branch targeted by the pull request, merges the pull request branch into it and then runs the workflow from that merge commit. It does NOT run at the HEAD commit of the pull request branch. So if you have different results locally make sure to checkout, fetch and pull the target branch and rebase your branch onto it.
  - Install the system dependencies
  - Install the javascript dependencies
  - Build the dependencies of LLD from source
  - Runs the `test:jest` script

- **End to End testing** (For linux, macOS and windows - in parallel)
  - Checkout the repository
  - Install the system dependencies
  - Install the javascript dependencies
  - Build the dependencies of LLD from source
  - Bundles the LLD javascript (`build:testing` script) and the SDK dummy app
  - Tests with [playwright](https://playwright.dev/) (`test:playwright` script)
  - Uploads the playwright results as artifacts

Look for for the source of the error in the logs.

**Use the keyboard shortcut Cmd + F on macOS or Ctrl + F on Windows and Linux to search for the relevant error message.**

The issue might be unrelated to the LLD codebase, but rather related to a dependency like `live-common` or `ledgerjs` for instance.

The error message should be enough to understand what went wrong. If it's not the case, then you should try to reproduce the error locally.

### Screenshots mismatch

Most of the time the CI fails because playwright detected a change while performing [Visual Comparisons](https://playwright.dev/docs/test-snapshots).

The check run summary should contain a report (including snapshot diff images) to help understanding what happened.

If you are sure that the changes are expected, you can update the snapshots by commenting `/generate-screenshots` on the pull request or clicking the `Regen. Screenshots` button at the top of this page.

It will trigger a workflow that will update the snapshots on all operating systems and push the changes to the pull request after completion.

To run playwright locally you can use the `pnpm desktop test:playwright` command - but you will need to bundle the app using `pnpm desktop build` (or `pnpm desktop build:testing`) beforehand.

### Unit tests issue

You can run jest locally by using the `pnpm desktop test:jest` command.

### Check other runs of the same workflow

Check other runs of the same workflow. If other branches are experiencing the same issue, it's likely that the error is not specific to your code.

### Review the workflow code.

[The workflow YAML file](https://github.com/LedgerHQ/ledger-live/blob/develop/.github/workflows/test-desktop.yml) provides information about the commands that are run on the continuous integration (CI) environment.

You should be able to reproduce locally by simply running the commands in the same order.

### Infrastucture issues

Consider the possibility of infrastructure issues.

If the error appears to be related to a slow network or a physical machine, it's possible that the problem is not related to the code. In this case, wait a bit and restart the job, or file an issue if the problem persists.
