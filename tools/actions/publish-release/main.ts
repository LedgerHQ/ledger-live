import * as github from "@actions/github";
import * as core from "@actions/core";

const main = async (): Promise<void> => {
  try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const owner: string = core.getInput("owner");
    const repo: string = core.getInput("repo");
    const id: string = core.getInput("id");
    const body: string = core.getInput("body");

    core.info("=== Release notes ===");
    core.info(body);

    const { data } = await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: Number(id),
      draft: false,
      prerelease: false,
      body,
    });

    if (!data) {
      throw new Error(`Could not update the draft ${id}`);
    }

    core.info(`Draft with id ${id} has been released`);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
};

main().catch((err) => core.setFailed(err));
