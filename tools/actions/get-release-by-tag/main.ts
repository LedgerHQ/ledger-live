import * as core from "@actions/core";
import * as github from "@actions/github";

async function main(): Promise<void> {
  try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const owner: string = core.getInput("owner");
    const repo: string = core.getInput("repo");
    const tag: string = core.getInput("tag");

    const { data } = await octokit.rest.repos.listReleases({
      owner,
      repo,
    });

    if (!data) {
      throw new Error("No releases found");
    }

    const draft = data.filter((r) => r.draft).find((d) => d.tag_name === tag);
    const [last] = data
      .filter((d) => !!d.published_at)
      .sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      );

    if (!draft) {
      throw new Error(`Could not find draft for tag ${tag}`);
    }

    if (!last) {
      core.warning("No previous release found");
    }

    const { id } = draft;

    core.setOutput("id", id.toString());
    core.setOutput("previousTag", last.tag_name);
  } catch (error) {
    console.log(error);
    core.setFailed(error.message);
  }
}

main().catch((err) => core.setFailed(err));
