import { toAccountRaw } from "../account";
import { Account } from "../types";
import { logFile } from "./speculosProxy";
import { getEnv } from "../env";
import { promiseAllBatched } from "../promise";

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
  await promiseAllBatched(
    getEnv("BOT_MAX_CONCURRENT"),
    [
      { title: "full-report.md", content: body },
      { title: "slack-comment-template.md", content: slackCommentTemplate },
      // { title: "before-app.json", content: makeAppJSON(allAccountsBefore) },
      // { title: "after-app.json", content: makeAppJSON(allAccountsAfter) },
    ],
    (item) => {
      return logFile(item.title, item.content);
    }
  );
  // the last two logs are kind of heavy. we probably need to compress them later
};
