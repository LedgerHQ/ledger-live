import { ProbotOctokit, Context } from "probot";
import https from "https";
import { unzipSingleFile } from "./zip";

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

  if (updateToPendingFields) {
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.id,
      status: "in_progress",
      started_at: new Date().toISOString(),
      ...updateToPendingFields,
    });
  }

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
