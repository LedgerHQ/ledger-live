/** Interface for baseline performance report metadata */
export interface BaselineMetadata {
  /** GitHub repository */
  repository: string;
  /** Workflow name */
  workflow: string;
  /** Run ID */
  runId: number;
  /** Commit SHA */
  commitSha: string;
  /** Run date */
  runDate: string;
  /** Branch name */
  branch: string;
}

/** Interface for a workflow run, from the GitHub API */
export interface WorkflowRun {
  /** The ID of the workflow run */
  id: number;
  /** The ID of the workflow */
  workflow_id: number;
  /** The SHA of the commit */
  head_sha: string;
  /** The branch of the commit */
  head_branch: string;
  /** The status of the workflow run */
  status: string;
  /** The conclusion of the workflow run */
  conclusion: string;
  /** The date and time the workflow run was created */
  created_at: string;
}

/** Interface for an artifact stored in a workflow run, from the GitHub API */
export interface Artifact {
  /** The ID of the artifact */
  id: number;
  /** The name of the artifact */
  name: string;
  /** The URL to download the artifact */
  archive_download_url: string;
}
