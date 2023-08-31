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

  // @ts-expect-error complicated typings
  app.on(["issue_comment.created" /*, "issues.opened" */], async context => {
    if (context.isBot) return;

    const { payload, octokit } = context;
    const isPR = (issue: any) => issue.pull_request !== undefined;

    context.log.info(`[⚙️ Commands](issue_comment.created) PR #${payload.issue.number}`);

    const issue = payload.issue;
    const comment = payload.comment;
    const command = comment.body.match(matcher);

    if (!isPR(issue)) return;
    if (!command || (command && command[1] !== name)) return;

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
