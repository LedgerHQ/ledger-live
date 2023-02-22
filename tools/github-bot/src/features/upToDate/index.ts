import { Probot } from "probot";
import { batch, CheckRun, getCheckRunByName, updateCheckRun } from "./tools";

const CHECK_NAME = "@PR • Up to date";

/**
 * Checks if every pull requests referencing a commit are up-to-date.
 *
 * @param app The Probot application.
 */
export function upToDate(app: Probot) {
  app.on(
    [
      "pull_request.opened",
      "pull_request.reopened",
      "pull_request.synchronize",
      "pull_request.ready_for_review",
      // This event is triggered when updating the base branch from the UI…
      // …even though the docs say that it's supposed to be .synchronize, it's not.
      "pull_request.edited",
    ],
    async (context) => {
      const { payload, octokit } = context;
      const { owner, repo } = context.repo();
      const prHead = payload.pull_request.head;

      let checkRun: CheckRun | null = null;

      // Check if the check run already exists.
      try {
        const response = await getCheckRunByName({
          octokit,
          owner,
          repo,
          ref: prHead.sha,
          check_name: CHECK_NAME,
        });
        if (response.status === 200) {
          if (response.data.total_count > 0) {
            checkRun = response.data.check_runs[0];
          }
        }
      } catch (e) {
        // ignore
      }

      if (!checkRun) {
        // If not, create it.
        await octokit.checks.create({
          owner,
          repo,
          name: CHECK_NAME,
          head_sha: prHead.sha,
          status: "in_progress",
        });
      } else {
        // Else, retrigger the check run.
        await octokit.checks.rerequestRun({
          owner,
          repo,
          check_run_id: checkRun.id,
        });
      }
    }
  );

  app.on("push", async (context) => {
    const { payload, octokit } = context;
    const { owner, repo } = context.repo();

    // Remove tags
    if (!payload.ref.startsWith("refs/heads/")) return;

    // List all pull requests targeting the branch that was just pushed to.
    const matchingPullRequests = await octokit.paginate(octokit.pulls.list, {
      owner,
      repo,
      base: payload.ref.split("/").pop(),
    });

    const tasks = matchingPullRequests.map((pr) => async () => {
      // Retrieve the check run by name.
      const checkRunResponse = await octokit.checks.listForRef({
        owner: pr.base.repo.owner.login,
        repo: pr.base.repo.name,
        ref: pr.head.sha,
        check_name: CHECK_NAME,
      });

      // If the check run exists, update it.
      if (checkRunResponse.data.total_count === 1) {
        const checkRun = checkRunResponse.data.check_runs[0];

        await octokit.checks.rerequestRun({
          owner,
          repo,
          check_run_id: checkRun.id,
        });
      }
    });

    // Speeds up the api calls by running 10 concurrent tasks.
    await batch(tasks, 10);
  });

  // Perform the actual check when created or retriggered.
  app.on(["check_run.rerequested", "check_run.created"], async (context) => {
    const { payload, octokit } = context;
    const { owner, repo } = context.repo();

    if (payload.check_run.name !== CHECK_NAME) return;

    await updateCheckRun({
      octokit,
      owner,
      repo,
      checkRun: payload.check_run,
    });
  });
}
