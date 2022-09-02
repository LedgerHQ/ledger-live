import fetch from "isomorphic-unfetch";
import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";

function handleErrors(response) {
  if (!response.ok) {
    throw Error(response.statusText);
  }
  return response;
}

async function main() {
  const githubToken = core.getInput("githubToken");
  const githubSha = core.getInput("githubSha");
  const slackChannel = core.getInput("slackChannel");
  const slackIconEmoji = core.getInput("slackIconEmoji");
  const slackApiToken = core.getInput("slackApiToken");

  // load reports
  const reportsFolder = path.resolve(core.getInput("path"));
  const reportBodyP = fs.promises.readFile(
    path.join(reportsFolder, "github-report.md"),
    "utf-8"
  );
  const slackCommentTemplateP = fs.promises.readFile(
    path.join(reportsFolder, "slack-comment-template.md"),
    "utf-8"
  );

  // upload to github comment
  const githubUrl = `https://api.github.com/repos/LedgerHQ/ledger-live/commits/${githubSha}/comments`;
  console.log("sending to " + githubUrl);
  const githubComment = await fetch(githubUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: await reportBodyP }),
  })
    .then(handleErrors)
    .then((r) => r.json());

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
        icon_emoji: slackIconEmoji || ":mere_denis:",
      }),
    }).then(handleErrors);
  }
}

main().catch((err) => {
  core.setFailed(err);
});
