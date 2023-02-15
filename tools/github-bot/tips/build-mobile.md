## 💡 Basics Tips

##### To share some piece of advice and help the community, please do not hesitate to [edit this file](https://github.com/LedgerHQ/ledger-live/edit/develop/tools/github-bot/tips/build-mobile.md) and submit a pull request. Thank you! 🙏

If you're troubleshooting a build failure, here are a few tips to keep in mind.

_Note: you should always navigate to the workflow run page linked above to get additional information about the build failure._

### ⚠️ Read the logs ⚠️

#### Start by carefully reading the logs. In most cases (99% of the time), this will be enough to understand the cause of the failure.

### Determine if the failure is platform-specific

This CI workflow actually build LLM only for the android platform.

Even though there are 2 jobs (macOS -> ios, linux -> android) the macOS job is a dummy one that only bundles the javascript part.
Due to current Apple limitations, we cannot build and provide test `.ipa`.

Nevertheless it may be very unlikely but not impossible that producing the javascript bundle fails on macOS but not on linux.

### Identify the specific step where the error occurred

The LLM build process consists of the following actions that are performed sequentially (in a nutshell):

- On linux:
  - Checkout the repository. ℹ️ For pull requests, it does a checkout of the branch targeted by the pull request, merges the pull request branch into it and then runs the workflow from that merge commit. It does NOT run at the HEAD commit of the pull request branch. So if you have different results locally make sure to checkout, fetch and pull the target branch and rebase your branch onto it.
  - Install the system dependencies
  - Install the javascript dependencies
  - Build all the dependencies required by LLM and belonging to the ledger-live repository
  - Build the `apk`
- On macos:
  - Checkout the repository. ℹ️ For pull requests, it does a checkout of the branch targeted by the pull request, merges the pull request branch into it and then runs the workflow from that merge commit. It does NOT run at the HEAD commit of the pull request branch. So if you have different results locally make sure to checkout, fetch and pull the target branch and rebase your branch onto it.
  - Install the system dependencies
  - Install the javascript dependencies
  - Build the javascript bundle

Look for for the source of the error in the logs.

**Use the keyboard shortcut Cmd + F on macOS or Ctrl + F on Windows and Linux to search for the relevant error message.**

The error could be unrelated to the LLM codebase, but rather related to a dependency like `live-common` or `ledgerjs`.

### Check other runs of the same workflow

Check other runs of the same workflow. If other branches are experiencing the same issue, it's likely that the error is not specific to your code.

### Review the workflow code.

[The workflow YAML file](https://github.com/LedgerHQ/ledger-live/blob/develop/.github/workflows/build-mobile.yml) provides information about the commands that are run on the continuous integration (CI) environment.

You should be able to reproduce locally by simply running the commands in the same order.

### Infrastucture issues

Consider the possibility of infrastructure issues. If the error appears to be related to a slow network or a physical machine, it's possible that the problem is not related to the code. In this case, wait a bit and restart the job, or contact the infrastructure team if the problem persists.
