import * as core from "@actions/core";
import * as github from "@actions/github";
import { desktopChecks } from "./desktop";
import { mobileChecks } from "./mobile";

// here is the main logic of the action
async function main() {
  const githubToken = core.getInput("token");
  const prNumber = core.getInput("prNumber");
  // const artifactsFolder = core.getInput("artifactsFolder");
  const mode = core.getInput("mode");
  const baseBranch = core.getInput("baseBranch");
  const octokit = github.getOctokit(githubToken);

  if (mode === "desktop") {
    desktopChecks({
      githubToken,
      prNumber,
      baseBranch,
      octokit,
    });
  }

  if (mode === "mobile") {
    mobileChecks({
      githubToken,
      prNumber,
      baseBranch,
      octokit,
    });
  }
}

main().catch(err => {
  core.setFailed(err);
});
