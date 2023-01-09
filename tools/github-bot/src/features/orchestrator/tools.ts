import { ProbotOctokit } from "probot";
import { formatConclusion, getStatusEmoji } from "../../tools";
import { BOT_APP_ID, GATE_CHECK_RUN_NAME, WORKFLOWS } from "./const";

type Octokit = InstanceType<typeof ProbotOctokit>;

export async function updateGateCheckRun(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
) {
  const checkSuites = await octokit.checks.listSuitesForRef({
    owner,
    repo,
    ref,
  });
  const checkSuite = checkSuites.data.check_suites.find(
    (suite) => suite.app?.id === BOT_APP_ID
  );
  if (checkSuite) {
    const rawCheckRuns = await octokit.checks.listForSuite({
      owner,
      repo,
      check_suite_id: checkSuite.id,
    });

    const rawWorkflowRuns = await octokit.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      head_sha: checkSuite.head_sha,
    });

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
    let gateId = null;

    let summary = `#### This is the gate check run. It aggregates the status of all the other checks in the check suite.`;
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
          if (check_run.name === GATE_CHECK_RUN_NAME) {
            gateId = check_run.id;
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

          summary += `\n- ${getStatusEmoji(
            check_run.conclusion || check_run.status
          )} **[${check_run.name}](${workflowRun?.html_url ||
            check_run.html_url})**: \`${check_run.conclusion ||
            check_run.status}\``;

          const priority = conclusions.indexOf(
            check_run.conclusion || "neutral"
          );
          const accumulatorPriority = conclusions.indexOf(acc[0]);
          const newPriority =
            priority > accumulatorPriority
              ? check_run.conclusion || "neutral"
              : acc[0];
          const newStatus =
            check_run.status === "completed" && acc[1] === "completed"
              ? "completed"
              : "in_progress";
          return [newPriority, newStatus];
        },
        ["success", "completed"]
      );

    if (gateId) {
      if (aggregatedStatus === "completed") {
        await octokit.checks.update({
          owner,
          repo,
          check_run_id: gateId,
          status: "completed",
          conclusion: aggregatedConclusion,
          output: {
            title: formatConclusion(aggregatedConclusion),
            summary,
          },
          completed_at: new Date().toISOString(),
        });
      } else {
        await octokit.checks.update({
          owner,
          repo,
          check_run_id: gateId,
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
