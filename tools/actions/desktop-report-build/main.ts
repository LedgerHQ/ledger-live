import * as fs from "fs";

import * as core from "@actions/core";
import * as github from "@actions/github";

import { DESKTOP_JOB_OS, isSuccess, parseJobStatuses } from "./common";

async function main() {
  const githubToken = core.getInput("token");
  const statuses = core.getInput("statuses");
  const attempt = core.getInput("attempt");

  const octokit = github.getOctokit(githubToken);

  const jobs = await octokit.paginate(octokit.rest.actions.listJobsForWorkflowRunAttempt, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    run_id: github.context.runId,
    attempt_number: Number(attempt),
  });

  const jobStatuses = parseJobStatuses(statuses);

  const findJobUrl = (os: string) =>
    jobs.find(job => job.name == `Build Ledger Live Desktop | ${os}`)?.html_url;

  const isFailed = Object.values(jobStatuses).some(e => e === "failure");

  let summary = ``;

  summary += `|`;

  const jobStatusesKeys = Object.keys(jobStatuses);
  jobStatusesKeys.forEach(_key => {
    const key = _key as keyof typeof DESKTOP_JOB_OS;

    summary += ` [${DESKTOP_JOB_OS[key].symbol} ${DESKTOP_JOB_OS[key].name}](${findJobUrl(
      DESKTOP_JOB_OS[key].id,
    )}) |`;
  });

  summary += `
  |`;

  for (let i = 0; i < jobStatusesKeys.length; i++) {
    summary += ` :--: |`;
  }

  summary += `
  |`;

  jobStatusesKeys.forEach(_key => {
    const key = _key as keyof typeof jobStatuses;

    summary += ` ${isSuccess(jobStatuses[key]) ? "✅" : "❌"} (${jobStatuses[key]}) |`;
  });

  summary += `

  [⚙️ Summary](https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId})
  `;

  const data = {
    isFailed,
    summary,
  };

  fs.writeFileSync("summary.json", JSON.stringify(data), "utf-8");
}

main().catch(err => {
  core.setFailed(err);
});
