import * as core from "@actions/core";
import {
  generateSuperReport,
  getLatestCommitShaOfBranch,
  loadReports,
  uploadCommentToGithubSha,
  uploadToSlack,
} from "./logic";

async function main() {
  const githubToken = core.getInput("githubToken");
  const branch = core.getInput("branch");
  const days = core.getInput("days");
  const slackChannel = core.getInput("slackChannel");
  const slackIconEmoji = core.getInput("slackIconEmoji");
  const slackApiToken = core.getInput("slackApiToken");
  const environment = core.getInput("environment");

  const reports = await loadReports({ branch, days, githubToken, environment });

  const { reportMarkdownBody, reportSlackText } = generateSuperReport(reports, days);

  const sha = await getLatestCommitShaOfBranch({ githubToken, branch });

  const githubComment = await uploadCommentToGithubSha({
    sha,
    githubToken,
    reportMarkdownBody,
  });

  if (slackApiToken && githubComment) {
    const text = reportSlackText.replace("{{url}}", githubComment.html_url);
    await uploadToSlack({ text, slackApiToken, slackChannel, slackIconEmoji });
  }
}

main().catch(err => {
  core.setFailed(err);
});
