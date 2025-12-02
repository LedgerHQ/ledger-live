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

  let reporter;

  if (mode === "desktop") {
    reporter = await desktopChecks({
      githubToken,
      prNumber,
      baseBranch,
      octokit,
    });
  }

  if (mode === "mobile") {
    reporter = await mobileChecks({
      githubToken,
      prNumber,
      baseBranch,
      octokit,
    });
  }

  // Fail the CI job if there are any errors
  if (reporter && reporter.hasErrors()) {
    core.setFailed("Bundle size checks failed. See the PR comment for details.");
  }
}

main().catch(err => {
  core.setFailed(err);
});
