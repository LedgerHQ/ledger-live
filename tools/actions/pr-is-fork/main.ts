import * as github from "@actions/github";
import * as core from "@actions/core";

const main = async function(): Promise<void> {
  try {
    const token = core.getInput("token");
    const context = github.context;
    const octokit = github.getOctokit(token);
    const owner = core.getInput("owner") || context.repo.owner;
    const repo = core.getInput("repo") || context.repo.repo;
    const nonPrResult = core.getInput("non-pr-result");
    const pull_number = parseInt(
      core.getInput("pull_number") || context.issue.number + ""
    );

    console.log({
      owner,
      repo,
      pull_number,
      nonPrResult,
    });

    if (!!nonPrResult && context.eventName !== "pull_request") {
      core.setOutput("pr-is-fork", nonPrResult);
      return;
    }

    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    });

    const isFork = pr.head.repo.fork;
    console.log("Is this PR a fork?\n" + isFork);
    core.setOutput("pr-is-fork", pr.head.repo.fork);
  } catch (error) {
    console.error(error);
    console.log("Is this PR a fork?\n" + "false");
    core.setOutput("pr-is-fork", true);
  }
};

main();
