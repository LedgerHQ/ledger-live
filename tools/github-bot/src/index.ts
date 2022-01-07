import { Probot } from "probot";
import { commands } from "./commands";

const isValidBranchName = (branch: string): boolean =>
  /^(feat|support|bugfix)\/.+/.test(branch) ||
  ["release", "hotfix"].includes(branch);

const isValidUser = (user: string): boolean =>
  !["ledgerlive", "live-github-bot[bot]"].includes(user);

export = (app: Probot) => {
  commands(app, "generate-screenshots", async (context, data) => {
    const { octokit, payload } = context;

    if (context.isBot) return;

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: context.payload.comment.id,
      content: "rocket",
    });

    await octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "generate-screenshots.yml",
      ref: "feat/probot",
      inputs: {
        number: `${data.number}`,
        login: `${payload.issue.user.login}`,
      },
    });
  });

  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    const { payload, octokit } = context;
    const repository = context.repo();
    const branch = payload.pull_request.head.ref;
    const isBranchValid = isValidBranchName(branch);
    const isUserValid = isValidUser(payload.pull_request.user.login);
    let body = "";
    let comment;

    if (!isUserValid) return;

    if (!isBranchValid) {
      body = `Unfortunately this branch does not follow the [CONTRIBUTING.MD](https://github.com/LedgerHQ/ledger-live/blob/monorepo-setup/CONTRIBUTING.md) conventions and will be closed automatically.
        Feel free to reopen this PR once you have browsed through the guidelines.
      `;

      comment = context.issue({
        body,
      });

      await octokit.issues.createComment(comment);
      await octokit.pulls.update({
        owner: repository.owner,
        repo: repository.repo,
        pull_number: payload.number,
        state: "closed",
      });

      return;
    }
  });
};
