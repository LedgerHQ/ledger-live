import { Probot } from "probot";

export const isValidBranchName = (branch: string): boolean =>
  /^(feat|support|bugfix|releases)\/.+/.test(branch) ||
  /^revert-[0-9]+-(feat|support|bugfix|releases)\/.+/.test(branch) ||
  ["release", "hotfix"].includes(branch);

export const isValidUser = (user: string): boolean =>
  ![
    "ledgerlive",
    "live-github-bot[bot]",
    "github-actions[bot]",
    "dependabot[bot]",
  ].includes(user);

export const isValidBody = (body: string | null): boolean => {
  if (!body) return false;

  const description =
    "_Replace this text by a clear and concise description of what this pull request is about and why it is needed._";

  const requiredHeadings = [
    "### 📝 Description",
    "### ❓ Context",
    "### ✅ Checklist",
    // "### 🚀 Expectations to reach",
  ];

  const results = body.split(/\r?\n/).reduce(
    (acc, line) => {
      // Dummy description line has not been replaced.
      if (line === description) {
        return {
          ...acc,
          dummyDescription: true,
        };
      }

      const headingIndex = requiredHeadings.findIndex((heading) =>
        line.startsWith(heading)
      );
      // Template required heading is still in the body.
      if (headingIndex > -1) {
        acc.matchHeadings[headingIndex] = true;
        return acc;
      }

      return acc;
    },
    {
      dummyDescription: false,
      matchHeadings: requiredHeadings.map(() => false),
    }
  );

  return !results.dummyDescription && results.matchHeadings.every(Boolean);
};

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
