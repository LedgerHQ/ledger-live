import { Probot } from "probot";

/**
 *  commands is a helper to wrap the validation of some text from issues commented on PR and PR messages
 *  so we can trigger specific actions
 */
export const commands = (
  app: Probot,
  name: string,
  // arguments is a string of arguments separated by a comma ","
  callback: (
    context: any,
    data: {
      number: number;
      name: string;
      arguments?: string;
      commentId?: number;
    },
  ) => Promise<void>,
) => {
  const matcher = /^\/([\w-]+)\b *(.*)?$/m;

  app.on(["issue_comment.created" /*, "issues.opened" */], async context => {
    if (context.isBot) return;

    const { payload, octokit } = context;
    const isPR = (issue: any) => issue.pull_request !== undefined;

    context.log.info(`[⚙️ Commands](issue_comment.created) PR #${payload.issue.number}`);

    const issue = payload.issue;
    const comment = payload.comment;
    const command = comment.body.match(matcher);
    const login = payload.sender.login;

    if (!isPR(issue)) return;
    if (!command || (command && command[1] !== name)) return;

    try {
      const res = await octokit.orgs.checkMembershipForUser({
        org: "LedgerHQ",
        username: login,
      });

      if (res.status >= 300) {
        await octokit.issues.createComment({
          ...context.repo(),
          issue_number: issue.number,
          body: `@${login} you are not part of the organization, please contact a maintainer if you need to run this command.`,
        });
        await octokit.rest.reactions.createForIssueComment({
          ...context.repo(),
          comment_id: comment.id,
          content: "-1",
        });
        return;
      }
    } catch (error) {
      await octokit.issues.createComment({
        ...context.repo(),
        issue_number: issue.number,
        body: `@${login} you are not part of the organization, please contact a maintainer if you need to run this command.`,
      });
      await octokit.rest.reactions.createForIssueComment({
        ...context.repo(),
        comment_id: comment.id,
        content: "-1",
      });
      return;
    }

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: comment.id,
      content: "rocket",
    });

    return callback(context, {
      number: issue.number,
      name: command[1],
      arguments: command[2],
      commentId: comment.id,
    });
  });
};
