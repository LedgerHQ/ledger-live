import { toAccountRaw } from "../account";
import { Account } from "../types";
import { logFile } from "./speculosProxy";

function makeAppJSON(accounts: Account[]) {
  const jsondata = {
    data: {
      settings: {
        hasCompletedOnboarding: true,
      },
      accounts: accounts.map((account) => ({
        data: toAccountRaw(account),
        version: 1,
      })),
    },
  };
  return JSON.stringify(jsondata);
}

export const botReportFolder = async ({
  body,
  slackCommentTemplate,
  allAccountsBefore,
  allAccountsAfter,
}: {
  body: string;
  slackCommentTemplate: string;
  allAccountsBefore: Account[];
  allAccountsAfter: Account[];
}) => {
  await Promise.all([
    logFile("full-report.md", body),
    logFile("slack-comment-template.md", slackCommentTemplate),
    logFile("before-app.json", makeAppJSON(allAccountsBefore)),
    logFile("after-app.json", makeAppJSON(allAccountsAfter)),
  ]);
};
