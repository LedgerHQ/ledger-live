import { Probot } from "probot";
import { commands, isValidBranchName, isValidUser } from "./tools";

export default (app: Probot) => {
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
      ref: "monorepo-setup",
      inputs: {
        number: `${data.number}`,
        login: `${payload.issue.user.login}`,
      },
    });
  });

  // trigger to autoclose PR when not respecting guidelines
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    const { payload, octokit } = context;
    const repository = context.repo();
    const branch = payload.pull_request.head.ref;
    const login = payload.pull_request.user.login;
    const isBranchValid = isValidBranchName(branch);
    const isUserValid = isValidUser(login);
    let body = "";
    let comment;

    if (!isUserValid) return;

    if (!isBranchValid) {
      body = `@${login}
      Unfortunately this branch name (**${branch}**) does not follow the [CONTRIBUTING.MD](https://github.com/LedgerHQ/ledger-live/blob/monorepo-setup/CONTRIBUTING.md) conventions and will be closed automatically.
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
