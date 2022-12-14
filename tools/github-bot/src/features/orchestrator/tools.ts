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

export const createOrRerequestRunByName = async ({
  octokit,
  owner,
  repo,
  sha,
  checkName,
  updateToPendingFields = {},
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  sha: string;
  checkName: string;
  updateToPendingFields?: Record<string, any>;
}) => {
  let checkRun;

  try {
    const response = await getCheckRunByName({
      octokit,
      owner,
      repo,
      ref: sha,
      checkName,
    });
    if (response.status === 200) {
      if (response.data.total_count > 0) {
        checkRun = response.data.check_runs[0];
      }
    }
  } catch (e) {
    // ignore
  }

  if (!checkRun) {
    // If not, create it.
    const { data } = await octokit.checks.create({
      owner,
      repo,
      name: checkName,
      head_sha: sha,
      status: "queued",
      started_at: new Date().toISOString(),
    });
    checkRun = data;
  } else {
    // Else, retrigger the check run.
    await octokit.checks.rerequestRun({
      owner,
      repo,
      check_run_id: checkRun.id,
    });
  }

  // if (updateToPendingFields) {
  //   await octokit.checks.update({
  //     owner,
  //     repo,
  //     check_run_id: checkRun.id,
  //     status: "in_progress",
  //     ...updateToPendingFields,
  //   });
  // }

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

    let summary = `### Monitoring:`;

    const [
      aggregatedConclusion,
      aggregatedStatus,
    ] = rawCheckRuns.data.check_runs.reduce(
      (acc, check_run) => {
        if (check_run.name === GATE_CHECK_RUN_NAME) {
          gateId = check_run.id;
          return acc;
        }

        if (
          Object.values(WORKFLOWS).every(
            (w) => w.checkRunName !== check_run.name
          )
        ) {
          return acc;
        }

        summary += `\n- **${check_run.name}**: _${check_run.conclusion ||
          check_run.status}_`;

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
            title: getStatusEmoji(aggregatedConclusion),
            summary,
          }, // TODO: add proper output
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

export function getGenericOutput(conclusion: string) {
  switch (conclusion) {
    case "success":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Completed successfully 🎉",
      };
    case "failure":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Completed with errors",
      };
    case "neutral":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Completed with neutral result",
      };
    case "cancelled":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Cancelled",
      };
    case "timed_out":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Timed out",
      };
    case "action_required":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Action required",
      };
    case "stale":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Stale",
      };
    case "skipped":
      return {
        title: getStatusEmoji(conclusion),
        summary: "Skipped",
      };
    default:
      return {
        title: "❓",
        summary: "Unknown",
      };
  }
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
      return "⏹";
    case "timed_out":
      return "⏱";
    case "action_required":
      return "🚨";
    case "stale":
      return "🧟";
    case "skipped":
      return "⏭";
    default:
      return "⏳";
  }
}
