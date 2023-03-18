import { Context, ProbotOctokit } from "probot";
import https from "https";
import { unzipSingleFile } from "./zip";

export const extractWorkflowFile = (
  payload: Context<"workflow_run">["payload"]
) => payload.workflow.path.split("@")[0].replace(".github/workflows/", "");

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
  const getResponse = await getCheckRunByName({
    octokit,
    owner,
    repo,
    ref: sha,
    checkName,
  });

  let started_at = new Date().toISOString();
  if (getResponse.data.total_count > 0) {
    const existingRun = getResponse.data.check_runs[0];
    if (existingRun.status === "in_progress" && existingRun.started_at) {
      started_at = existingRun.started_at;
    }
  }

  const { data: checkRun } = await octokit.checks.create({
    owner,
    repo,
    name: checkName,
    head_sha: sha,
    status: "in_progress",
    started_at,
    ...extraFields,
  });

  return checkRun;
};

const TIMEOUT = 500;
const MAX_RETRIES = 3;
export type WorkflowRunArtifacts = Awaited<
  ReturnType<Octokit["actions"]["listWorkflowRunArtifacts"]>
>["data"]["artifacts"];
export async function listWorkflowRunArtifacts(
  octokit: Octokit,
  owner: string,
  repo: string,
  run_id: number,
  attempt: number = 0
): Promise<WorkflowRunArtifacts> {
  const artifacts = await octokit.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id,
  });

  if (artifacts.data.artifacts.length > 0) {
    return artifacts.data.artifacts;
  }

  if (artifacts.data.artifacts.length === 0 && attempt <= MAX_RETRIES) {
    return new Promise((res) =>
      setTimeout(() => {
        res(listWorkflowRunArtifacts(octokit, owner, repo, run_id, ++attempt));
      }, TIMEOUT)
    );
  }

  return [];
}
