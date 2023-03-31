import fs from "fs/promises";
import path from "path";
import { ProbotOctokit } from "probot";
import { formatConclusion, getStatusEmoji } from "../../tools";
import {
  BOT_APP_ID,
  REF_PREFIX,
  WATCHER_CHECK_RUN_NAME,
  WORKFLOWS,
} from "./const";

type Octokit = InstanceType<typeof ProbotOctokit>;

export async function updateWatcherCheckRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<ReturnType<Octokit["checks"]["update"]> | void> {
  const checkSuites = await octokit.checks.listSuitesForRef({
    owner,
    repo,
    ref,
    app_id: BOT_APP_ID,
  });
  const checkSuite = checkSuites.data.check_suites.find(
    (suite) => suite.app?.id === BOT_APP_ID
  );

  if (checkSuite) {
    const [rawCheckRuns, rawWorkflowRuns] = await Promise.all([
      octokit.checks.listForSuite({
        owner,
        repo,
        check_suite_id: checkSuite.id,
      }),
      octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        head_sha: checkSuite.head_sha,
        exclude_pull_requests: true,
        event: "workflow_dispatch",
      }),
    ]);

    const conclusions = [
      "success",
      "pending",
      "waiting",
      "neutral",
      "stale",
      "skipped",
      "timed_out",
      "action_required",
      "cancelled",
      "startup_failure",
      "failure",
    ];
    let watcherId = null;

    let summary = `#### This is the watcher check run. It aggregates the status of all the other checks in the check suite.`;
    summary += `\n\n`;
    summary += `### 👁 Watching`;

    const [
      aggregatedConclusion,
      aggregatedStatus,
    ] = rawCheckRuns.data.check_runs
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .reduce(
        (acc, check_run) => {
          if (check_run.name === WATCHER_CHECK_RUN_NAME) {
            watcherId = check_run.id;
            return acc;
          }

          const workflowMeta = Object.entries(WORKFLOWS).find(
            ([, w]) => w.checkRunName === check_run.name
          );

          if (!workflowMeta) {
            return acc;
          }

          const workflowRun = rawWorkflowRuns.data.workflow_runs.find(
            (wr) => (wr as any).path === ".github/workflows/" + workflowMeta[0]
          );

          const workflowLink = workflowRun?.html_url
            ? ` _[(workflow)](${workflowRun.html_url})_`
            : "";

          summary += `\n- ${getStatusEmoji(
            check_run.conclusion || check_run.status
          )} **[${check_run.name}](${
            check_run.html_url
          })**${workflowLink}: \`${check_run.conclusion ||
            check_run.status}\` ${
            workflowMeta[1].required ? "" : "_(optional)_"
          }`;
          let newPriority;
          let newStatus;

          const priority = conclusions.indexOf(
            check_run.conclusion || "neutral"
          );
          const accumulatorPriority = conclusions.indexOf(acc[0]);

          if (workflowMeta[1].required) {
            newPriority =
              priority > accumulatorPriority
                ? check_run.conclusion || "neutral"
                : acc[0];
            newStatus =
              check_run.status === "completed" && acc[1] === "completed"
                ? "completed"
                : "in_progress";
          } else {
            newPriority = acc[0];
            newStatus = acc[1];
          }

          return [newPriority, newStatus];
        },
        ["success", "completed"]
      );

    if (watcherId) {
      if (aggregatedStatus === "completed") {
        const updateResponse = await octokit.checks.update({
          owner,
          repo,
          check_run_id: watcherId,
          status: "completed",
          conclusion: aggregatedConclusion,
          output: {
            title: formatConclusion(aggregatedConclusion),
            summary,
          },
          completed_at: new Date().toISOString(),
        });

        // Delete the previously created ref for forked PRs
        try {
          await octokit.rest.git.deleteRef({
            owner,
            repo,
            ref: `${REF_PREFIX}/forked/${checkSuite.head_sha}`,
          });
        } catch (error) {
          // Ignore error / maybe ref doesn't exist
        }

        return updateResponse;
      } else {
        return await octokit.checks.update({
          owner,
          repo,
          check_run_id: watcherId,
          status: aggregatedStatus,
          output: {
            title: "⚙️ Running",
            summary,
          },
        });
      }
    }
  }
}

export async function prIsFork(
  octokit: Octokit,
  repo: string,
  owner: string,
  prNumber?: number
) {
  if (prNumber === undefined) return true;

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  return !!pr.head.repo?.fork;
}

export async function getTips(
  workflowFile: string
): Promise<string | undefined> {
  const tipsFile = workflowFile.replace(".yml", ".md");
  const p = path.join(__dirname, "..", "..", "..", "tips", tipsFile);
  let tips = undefined;
  try {
    tips = await fs.readFile(p, "utf-8");
  } catch (error) {
    // ignore error, file is not found
  }
  return tips;
}
