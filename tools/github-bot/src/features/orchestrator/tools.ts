import { ProbotOctokit, Context } from "probot";
import https from "https";
import { unzipSingleFile } from "./zip";
import { BOT_APP_ID, GATE_CHECK_RUN_NAME, WORKFLOWS } from "./const";

type Octokit = InstanceType<typeof ProbotOctokit>;
type CheckRunResponse = ReturnType<Octokit["checks"]["listForRef"]>;
export const getCheckRunByName = async ({
  octokit,
  owner,
  repo,
  ref,
  checkName,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  ref: string;
  checkName: string;
}): Promise<CheckRunResponse> =>
  await octokit.checks.listForRef({
    owner,
    repo,
    ref,
    check_name: checkName,
  });

export const createRunByName = async ({
  octokit,
  owner,
  repo,
  sha,
  checkName,
  extraFields = {},
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  sha: string;
  checkName: string;
  extraFields?: Record<string, any>;
}) => {
  const { data: checkRun } = await octokit.checks.create({
    owner,
    repo,
    name: checkName,
    head_sha: sha,
    status: "in_progress",
    started_at: new Date().toISOString(),
    ...extraFields,
  });

  return checkRun;
};

export const extractWorkflowFile = (
  payload: Context<"workflow_run">["payload"]
) => payload.workflow.path.split("@")[0].replace(".github/workflows/", "");

export async function downloadArtifact(
  octokit: Octokit,
  owner: string,
  repo: string,
  artifactId: number
): Promise<Buffer> {
  const artifactResponse = await octokit.actions.downloadArtifact({
    owner,
    repo,
    artifact_id: artifactId,
    archive_format: "zip",
  });
  const downloadUrl = artifactResponse.url;

  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Node.js",
    };
    https.get(downloadUrl, { headers }, (res) => {
      const chunks: Buffer[] = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const buffer = Buffer.concat(chunks);

        if (res.statusCode !== 200) {
          return reject(
            new Error(
              `Request failed with status code ${
                res.statusCode
              }\n${buffer.toString()}`
            )
          );
        }

        try {
          resolve(unzipSingleFile(buffer));
        } catch (error) {
          reject(error);
        }
      });

      res.on("error", (error) => {
        reject(error);
      });
    });
  });
}

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
    ] = rawCheckRuns.data.check_runs.reduce(
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
          (wr) => wr.name === ".github/workflows/" + workflowMeta[0]
        );

        summary += `\n- ${getStatusEmoji(
          check_run.conclusion || check_run.status
        )} **[${check_run.name}](${workflowRun?.html_url ||
          check_run.html_url})**: \`${check_run.conclusion ||
          check_run.status}\``;

        const priority = conclusions.indexOf(check_run.conclusion || "neutral");
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

export function getGenericOutput(conclusion: string, summary?: string) {
  switch (conclusion) {
    case "success":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Completed successfully 🎉",
      };
    case "failure":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Completed with errors",
      };
    case "neutral":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Completed with neutral result",
      };
    case "cancelled":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Cancelled",
      };
    case "timed_out":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Timed out",
      };
    case "action_required":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Action required",
      };
    case "stale":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Stale",
      };
    case "skipped":
      return {
        title: formatConclusion(conclusion),
        summary: summary || "Skipped",
      };
    default:
      return {
        title: "❓ Unknown",
        summary: summary || "Unknown",
      };
  }
}

export function formatConclusion(conclusion: string) {
  return (
    getStatusEmoji(conclusion) +
    " " +
    conclusion[0].toLocaleUpperCase() +
    conclusion.slice(1)
  );
}

export function getStatusEmoji(status: string) {
  switch (status) {
    case "success":
      return "✅";
    case "failure":
      return "❌";
    case "neutral":
      return "🤷";
    case "cancelled":
      return "🛑";
    case "timed_out":
      return "⏱";
    case "action_required":
      return "🚨";
    case "stale":
      return "🧟";
    case "skipped":
      return "⏭";
    case "in_progress":
      return "⚙️";
    case "queued":
      return "⏳";
    default:
      return "❓";
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
