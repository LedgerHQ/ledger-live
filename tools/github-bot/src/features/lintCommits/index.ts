import { Probot } from "probot";
import { monitorWorkflow } from "../../tools/monitorWorkflow";

/**
 * Checks if every commits contained in a Pull Request respect the guidelines.
 *
 * @param app The Probot application.
 */
export function lintCommits(app: Probot) {
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
      const login = payload.sender.login;

      await octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: "commitlint.yml",
        ref: payload.pull_request.head.repo.fork
          ? payload.pull_request.base.ref
          : payload.pull_request.head.ref,
        inputs: {
          ref: payload.pull_request.head.ref,
          from: payload.pull_request.base.ref,
          login: login,
        },
      });
    }
  );

  monitorWorkflow(app, {
    file: "commitlint.yml",
    checkRunName: "@PR • Lint Commit Messages • commitlint (conventional)",
    description:
      "Lint the Pull Request commit messages according to the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.",
    summaryFile: "summary.json",
    getInputs: (payload) => ({
      ref: payload.check_run.head_sha,
      from: payload.check_run.pull_requests[0]?.base.ref,
      login: payload.sender.login,
    }),
  });
}
