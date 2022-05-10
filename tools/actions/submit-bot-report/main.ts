import fetch from "isomorphic-unfetch";
import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const githubToken = core.getInput("githubToken");
  const githubSha = core.getInput("githubSha");
  const slackChannel = core.getInput("slackChannel");
  const slackApiToken = core.getInput("slackApiToken");

  // load reports
  const reportsFolder = path.resolve(core.getInput("path"));
  const reportBodyP = fs.promises.readFile(
    path.join(reportsFolder, "full-report.md"),
    "utf-8"
  );
  const slackCommentTemplateP = fs.promises.readFile(
    path.join(reportsFolder, "slack-comment-template.md"),
    "utf-8"
  );

  // upload to github comment
  const githubComment = await fetch(
    `https://api.github.com/repos/LedgerHQ/ledger-live/commits/${githubSha}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: await reportBodyP }),
    }
  ).then((r) => r.json());

  console.log(githubComment);

  // optionally send to slack
  if (slackApiToken && githubComment) {
    const slackCommentTemplate = await slackCommentTemplateP;
    const text = slackCommentTemplate.replace(
      "{{url}}",
      githubComment.html_url
    );
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        channel: slackChannel || "ledger-live-bot",
      }),
    });
  }
}

main().catch((err) => {
  core.setFailed(err);
});
