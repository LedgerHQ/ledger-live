import { Probot } from "probot";
import { commands, isValidBody, isValidBranchName, isValidUser } from "./tools";

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
      ref: "develop",
      inputs: {
        number: `${data.number}`,
        login: `${payload.comment.user.login}`,
      },
    });
  });

  commands(app, "regen-pods", async (context, data) => {
    const { octokit, payload } = context;

    if (context.isBot) return;

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: context.payload.comment.id,
      content: "rocket",
    });

    await octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "regen-pods.yml",
      ref: "develop",
      inputs: {
        number: `${data.number}`,
        login: `${payload.comment.user.login}`,
      },
    });
  });

  // trigger to autoclose PR when not respecting guidelines
  app.on(["pull_request.opened", "pull_request.reopened"], async (context) => {
    const { payload, octokit } = context;
    const repository = context.repo();

    if (repository.repo !== "ledger-live") return;

    const branch = payload.pull_request.head.ref;
    const login = payload.pull_request.user.login;

    if (
      !isValidUser(login) &&
      // Close automatic PRs from smartling - except the ones triggered manually
      !/^(smartling-content-updated|smartling-translation-completed)-.+/.test(
        branch
      )
    )
      return;

    const isBranchValid = isValidBranchName(branch);
    const isBodyValid = isValidBody(payload.pull_request.body);

    if (isBranchValid && isBodyValid) return;

    let body =
      `❌ @${login}\n\n` +
      "#### Unfortunately this PR does not comply with the [Contributing Conventions](https://github.com/LedgerHQ/ledger-live/blob/develop/CONTRIBUTING.md) and will be closed automatically.\n" +
      "\n" +
      "Feel free to reopen this PR once you have browsed through the guidelines.\n" +
      "\n" +
      "-------\n" +
      "\n" +
      "Found Issues:\n";

    let comment;

    if (!isBranchValid) {
      body += `- _the branch name \`${branch}\` is invalid_\n`;
    }

    if (!isBodyValid) {
      body +=
        "- _the description is missing or you removed or overrode one or more sections of the [pull request template](https://github.com/LedgerHQ/ledger-live/blob/develop/.github/pull_request_template.md)_\n";
      body +=
        "_💡 make sure you added comments only inside the template sections - and not above the `📝 Description` heading_\n";
    }
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
  });

  // Ensure that the PR is up-to-date
  app.on(
    ["pull_request.synchronize", "pull_request.ready_for_review"],
    async (context) => {
      const { payload, octokit } = context;
      const { owner, repo } = context.repo();

      let runId = null;

      try {
        const isFork = payload.pull_request.head.repo.fork;
        const prBase = payload.pull_request.base;
        const prHead = payload.pull_request.head;
        const ownerPrefix = isFork ? `${prHead.repo.owner}:` : "";

        const checkRun = await octokit.checks.create({
          owner,
          repo,
          name: "PR is up-to-date",
          head_sha: prHead.sha,
          status: "in_progress",
        });
        runId = checkRun.data.id;

        const comparison = await octokit.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${prBase.ref}...${ownerPrefix}${prHead.ref}`,
          per_page: 1,
        });

        const isUpToDate = ["ahead", "identical"].includes(
          comparison.data.status
        );

        const output = isUpToDate
          ? {
              title: "💚 Success",
              summary:
                `Branch \`${prHead.ref}\` is identical or ahead of \`${prBase.ref}\`.\n` +
                "\n" +
                "**All good! 👍**",
            }
          : {
              title: "🔴 Failure",
              summary:
                `Branch \`${prHead.ref}\` is one or more commits behind \`${prBase.ref}\`.\n` +
                `\n` +
                `**Please rebase your branch on top of \`${prBase.ref}\`.**\n` +
                `\n` +
                `_If you are not comfortable with git and rebasing, here is a [nice guide](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)._`,
            };

        await octokit.checks.update({
          owner,
          repo,
          check_run_id: runId,
          status: "completed",
          conclusion: isUpToDate ? "success" : "failure",
          output,
        });
      } catch (error) {
        console.error(error);
        if (runId) {
          await octokit.checks.update({
            owner,
            repo,
            check_run_id: runId,
            status: "completed",
            conclusion: "failure",
            output: {
              title: "Error",
              summary: (error as Error).message,
            },
          });
        }
      }
    }
  );
};
