import { getOctokit } from "@actions/github";
import * as core from "@actions/core";
import AdmZip from "adm-zip";
import type { PerformanceReport } from "../models/performance";
import { BaselinePerformanceReport } from "../models/aggregate";
import { Artifact, BaselineMetadata, WorkflowRun } from "../models/github";

/** GitHub client for fetching performance reports from GitHub Actions */
export class GitHubClient {
  /** The GitHub client */
  private octokit: ReturnType<typeof getOctokit>;

  /** The owner of the repository */
  private owner: string;

  /** The repository name */
  private repo: string;

  /**
   * Creates a new GitHub client
   *
   * @param token
   * The GitHub token to use for authentication
   *
   * @param repository
   * The repository to fetch the performance report from
   */
  constructor(token: string, repository: string) {
    this.octokit = getOctokit(token);
    const [owner, repo] = repository.split("/");
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Fetches the latest successful performance report from the specified workflow
   *
   * @param workflowName
   * The name of the workflow to search for
   *
   * @param applicationPlatform
   * The platform of the application to search for
   *
   * @returns
   * Promise containing the baseline performance report and metadata
   */
  async getLatestBaselineReport(
    workflowName: string,
    applicationPlatform: string,
  ): Promise<BaselinePerformanceReport> {
    try {
      core.info(`Fetching latest successful workflow run for ${workflowName}...`);

      const workflowId = await this.getWorkflowId(workflowName);
      const workflowRun = await this.getLatestSuccessfulRun(workflowId);
      const performanceReport = await this.getPerformanceReportArtifact(
        workflowRun.id,
        applicationPlatform,
      );

      const metadata: BaselineMetadata = {
        repository: `${this.owner}/${this.repo}`,
        workflow: workflowName,
        runId: workflowRun.id,
        commitSha: workflowRun.head_sha,
        runDate: workflowRun.created_at,
        branch: workflowRun.head_branch,
      };

      core.info(`Successfully fetched baseline report from run ${workflowRun.id}`);
      return { report: performanceReport, metadata };
    } catch (error) {
      core.error(`Failed to fetch baseline report: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the workflow ID for the specified workflow name
   *
   * @param workflowName
   * The name of the workflow to search for
   *
   * @returns
   * Promise containing the workflow ID
   */
  private async getWorkflowId(workflowName: string): Promise<number> {
    core.info(`Getting workflow ID for ${workflowName} in ${this.owner}/${this.repo}`);
    const { data } = await this.octokit.rest.actions.listRepoWorkflows({
      owner: this.owner,
      repo: this.repo,
    });
    const workflow = data.workflows.find(
      w => w.name === workflowName || w.path?.includes(workflowName),
    );

    if (!workflow) {
      throw new Error(
        `Workflow ${workflowName} not found in repository ${this.owner}/${this.repo}`,
      );
    }

    core.info(`Workflow ID: ${workflow.id}`);
    return workflow.id;
  }

  /**
   * Gets the latest successful workflow run for the specified workflow ID
   *
   * @param workflowId
   * The ID of the workflow to search for
   *
   * @returns
   * The latest successful workflow run
   */
  private async getLatestSuccessfulRun(workflowId: number): Promise<WorkflowRun> {
    core.info(`Getting latest successful run for workflow ID ${workflowId}`);
    const { data } = await this.octokit.rest.actions.listWorkflowRuns({
      owner: this.owner,
      repo: this.repo,
      workflow_id: workflowId,
      status: "completed",
      conclusion: "success",
      per_page: 10,
    });

    if (data.workflow_runs.length === 0) {
      throw new Error(`No successful workflow runs found for workflow ID ${workflowId}`);
    }

    const [workflowRun] = data.workflow_runs;
    if (!isWorkflowRun(workflowRun)) {
      const value = workflowRun ? JSON.stringify(workflowRun) : String(workflowRun);
      throw new Error(`Invalid workflow run: ${value}`);
    }

    core.info(`Latest successful run: ${workflowRun.id}`);
    return workflowRun;
  }

  /**
   * Downloads and parses the performance report artifact from the specified run
   *
   * @param runId
   * The ID of the run to fetch the performance report from
   *
   * @returns
   * The performance report
   */
  private async getPerformanceReportArtifact(
    runId: number,
    applicationPlatform: string,
  ): Promise<PerformanceReport> {
    core.info(`Getting artifacts for run ${runId}`);
    const { data } = await this.octokit.rest.actions.listWorkflowRunArtifacts({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    const performanceArtifact = data.artifacts.find(
      (artifact: Artifact) => artifact.name === `${applicationPlatform}-performance-report.json`,
    );

    if (!performanceArtifact) {
      throw new Error(`Performance report artifact not found in run ${runId}`);
    }

    core.info(`Downloading baseline report: ${performanceArtifact.name}`);
    const { data: downloadData } = await this.octokit.rest.actions.downloadArtifact({
      owner: this.owner,
      repo: this.repo,
      artifact_id: performanceArtifact.id,
      archive_format: "zip",
    });

    core.info("Baseline report downloaded");
    const arrayBuffer = convertToArrayBuffer(downloadData);
    const performanceReport = await extractPerformanceReportFromZip(arrayBuffer);

    core.info("Baseline preport extracted");
    return performanceReport;
  }
}

/**
 * Checks if the given object is a valid workflow run
 *
 * @param workflowRun
 * The object to check
 *
 * @returns
 * True if the object is a valid workflow run, false otherwise
 */
function isWorkflowRun(workflowRun: unknown): workflowRun is WorkflowRun {
  return (
    typeof workflowRun === "object" &&
    workflowRun !== null &&
    "id" in workflowRun &&
    "workflow_id" in workflowRun &&
    "head_sha" in workflowRun &&
    "head_branch" in workflowRun &&
    "status" in workflowRun &&
    "conclusion" in workflowRun &&
    "created_at" in workflowRun
  );
}

/**
 * Converts the GitHub API download data to ArrayBuffer
 *
 * @param data
 * The data to convert
 *
 * @returns
 * The ArrayBuffer
 */
function convertToArrayBuffer(data: unknown): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (Buffer.isBuffer(data)) {
    const buffer = new ArrayBuffer(data.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < data.length; i++) {
      view[i] = data[i];
    }
    return buffer;
  }
  if (typeof data === "string") {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const buffer = new ArrayBuffer(bytes.length);
    const view = new Uint8Array(buffer);
    view.set(bytes);
    return buffer;
  }
  throw new Error("Unsupported data format for artifact download");
}

/**
 * Extracts the performance report from the downloaded zip artifact
 *
 * @param zipData
 * The zip data to extract the performance report from
 *
 * @returns
 * The performance report
 */
async function extractPerformanceReportFromZip(zipData: ArrayBuffer): Promise<PerformanceReport> {
  try {
    core.info("Extracting performance report from zip");
    const zip = new AdmZip(Buffer.from(zipData));
    const zipEntries = zip.getEntries();

    // Look for the performance report JSON file
    const performanceReportEntry = zipEntries.find(isPerformanceReportEntry);
    if (!performanceReportEntry) {
      throw new Error("performance-report.json not found in artifact zip");
    }

    const jsonContent = performanceReportEntry.getData().toString("utf8");
    const performanceReport: PerformanceReport = JSON.parse(jsonContent);
    return performanceReport;
  } catch (error) {
    core.error(`Failed to extract performance report from zip: ${error}`);
    throw error;
  }
}

/**
 * Checks if the given entry is a performance report entry
 *
 * @param entry
 * The entry to check
 *
 * @returns
 * True if the entry is a performance report entry, false otherwise
 */
function isPerformanceReportEntry(entry: AdmZip.IZipEntry): boolean {
  return entry.entryName === "performance-report.json";
}
