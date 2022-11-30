import { Probot } from "probot";
import { batch, updateCheckRun } from "./tools";

const CHECK_NAME = "PR is up-to-date";

// Check if the PRs are up to date with the base branch.
export function upToDate(app: Probot) {
  app.on(
    ["pull_request.synchronize", "pull_request.ready_for_review"],
    async (context) => {
      const { payload, octokit } = context;
      const { owner, repo } = context.repo();

      const isFork = payload.pull_request.head.repo.fork;
      const prBase = payload.pull_request.base;
      const prHead = payload.pull_request.head;

      const checkRun = await octokit.checks.create({
        owner,
        repo,
        name: CHECK_NAME,
        head_sha: prHead.sha,
        status: "in_progress",
      });

      await updateCheckRun({
        octokit,
        owner,
        repo,
        checkRunId: checkRun.data.id,
        isFork,
        prBase,
        prHead,
      });
    }
  );

  app.on("push", async (context) => {
    const { payload, octokit } = context;
    const { owner, repo } = context.repo();

    if (!payload.base_ref) {
      return;
    }

    // List all pull requests targetting the branch that was just pushed to.
    const matchingPullRequests = await octokit.paginate(octokit.pulls.list, {
      owner,
      repo,
      base: payload.base_ref,
    });

    const tasks = matchingPullRequests.map((pr) => async () => {
      // Retrieve the check run by name.
      const checkRunResponse = await octokit.checks.listForRef({
        owner: pr.head.repo.owner.login,
        repo: pr.head.repo.name,
        ref: pr.head.ref,
        check_name: CHECK_NAME,
      });

      // If the check run exists, update it.
      if (checkRunResponse.data.total_count === 1) {
        const checkRun = checkRunResponse.data.check_runs[0];
        const isFork = pr.head.repo.fork;
        const prBase = pr.base;
        const prHead = pr.head;

        await updateCheckRun({
          octokit,
          owner,
          repo,
          checkRunId: checkRun.id,
          isFork,
          prBase,
          prHead,
        });
      }
    });

    // Speeds up the api calls by running 10 concurrent tasks.
    await batch(tasks, 10);
  });
}
