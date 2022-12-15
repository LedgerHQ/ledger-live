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
    data: { number: number; name: string; arguments?: string }
  ) => {}
) => {
  const matcher = /^\/([\w-]+)\b *(.*)?$/m;

  app.on(["issue_comment.created" /*, "issues.opened" */], async (context) => {
    const { payload } = context;
    const isPR = (issue: any) => issue.pull_request !== undefined;

    const issue = payload.issue;
    const comment = payload.comment;
    const command = comment.body.match(matcher);

    if (!isPR(issue)) return;
    if (!command || (command && command[1] !== name)) return;

    return callback(context, {
      number: issue.number,
      name: command[1],
      arguments: command[2],
    });
  });

  app.on(["pull_request.opened"], async (context) => {
    const { payload } = context;
    const pr = payload.pull_request;
    const command = pr?.body?.match(matcher);

    if (!command || (command && command[1] !== name)) return;
    return callback(context, {
      number: pr.number,
      name: command[1],
      arguments: command[2],
    });
  });
};
