## 💡 Basics Tips

##### To share some piece of advice and help the community, please do not hesitate to [edit this file](https://github.com/LedgerHQ/ledger-live/edit/develop/tools/github-bot/tips/test.md) and submit a pull request. Thank you! 🙏

If you're troubleshooting a build failure, here are a few tips to keep in mind.

_Note: you should always navigate to the workflow run page linked above to get additional information about the build failure._

### ⚠️ Read the logs ⚠️

#### Start by carefully reading the logs. In most cases (99% of the time), this will be enough to understand the cause of the failure.

### Identify the specific step where the error occurred

The test process consists of the following tasks that are performed in parallel (in a nutshell):

- **Library tests** (On macOS and linux - windows is disabled for the moment)
  - Checkout the repository. ℹ️ For pull requests, it does a checkout of the branch targeted by the pull request, merges the pull request branch into it and then runs the workflow from that merge commit. It does NOT run at the HEAD commit of the pull request branch. So if you have different results locally make sure to checkout, fetch and pull the target branch and rebase your branch onto it.
  - Install the system dependencies
  - Install the javascript dependencies
  - Build affected libraries and their workspace dependencies.
    _Affected means that the library or one of its dependencies has been modified when compared to the base branch of the PR._
  - Tests the affected libraries by running the `test` script defined inside their package json file. Most of the time the script run `jest` scripts, linters and/or type checkers.

- **Documentation check**
  - Checkout the repository
  - Install the system dependencies
  - Install the javascript dependencies
  - Generate the documentation (`pnpm doc:ljs`)
  - Check that the documentation is up to date

- **CLI tests**
  - Checkout the repository
  - Install the system dependencies
  - Install the javascript dependencies
  - Build the cli located at `apps/cli`

Look for the part where the error happened in the logs and try to find which task and which library fails.

It might be a bit challenging if the failure happened during the "test libraries" phase, since we use `turborepo` to orchestrate the build and test of the libraries and everything happens in parallel.

An important thing to understand is that each line of the log is prefixed by a string containing the library and the command that has been run.

> `@ledgerhq/types-live:lint:    85:61  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any`

For instance, the line above has been outputted by the `lint` command of the `@ledgerhq/types-live` library.

**Use `cmd+f` on macOS or `ctrl+f` on windows/linux to search for the error message.**

The error message should be enough to understand what went wrong. If it's not the case, then you should try to reproduce the error locally.

### Documentation failure

This error is usually related to the documentation being out of date. You can run `pnpm doc:ljs` locally to reproduce the error and regenerate the documentation.

### Library failure

Find which step failed and which library is affected by the error. Then run the command that failed locally to try to reproduce.

To reproduce the exact same behaviour as the CI and test all affected packages, you can run the `pnpm run test --continue --filter="!./apps/**" --filter="!live-common-tools" --filter="!ledger-live...[$$BASE_BRANCH$$]"` command locally - just replace the `$$BASE_BRANCH$$` part with the branch you pull request is targeting (for instance: `[develop]`).

### Check other runs of the same workflow

Check other runs of the same workflow. If other branches are experiencing the same issue, it's likely that the error is not specific to your code.

### Review the workflow code.

[The workflow YAML file](https://github.com/LedgerHQ/ledger-live/blob/develop/.github/workflows/test-mobile.yml) provides information about the commands that are run on the continuous integration (CI) environment.

You should be able to reproduce locally by simply running the commands in the same order.

### Infrastucture issues

Consider the possibility of infrastructure issues. If the error appears to be related to a slow network or a physical machine, it's possible that the problem is not related to the code. In this case, wait a bit and restart the job, or contact the infrastructure team if the problem persists.
