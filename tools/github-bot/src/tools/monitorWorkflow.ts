import fs from "fs/promises";
import path from "path";
import { Probot, Context } from "probot";
import {
  createRunByName,
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
  listWorkflowRunArtifacts,
} from ".";

type CheckRunPayload = Context<"check_run">["payload"];
type GetInputsPayload = CheckRunPayload;

type WorkflowDescriptor = {
  file: string;
  checkRunName: string;
  description?: string;
  summaryFile?: string;
  getInputs: (payload: GetInputsPayload) => Record<string, any>;
};
export function monitorWorkflow(app: Probot, workflow: WorkflowDescriptor) {
  /**
   * When a workflow is requested for the first time:
   *  - Create the related check run
   */
  app.on("workflow_run.requested", async (context) => {
    const { payload, octokit } = context;

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);

    if (workflowFile !== workflow.file) return;

    context.log.info(
      `[Monitoring Workflow](workflow_run.requested) ${payload.workflow_run.name}`
    );
    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });
    const workflowUrl = payload.workflow_run.html_url;
    const summaryPrefix = workflow.description
      ? `#### ${workflow.description}\n\n`
      : "";

    // Will trigger the check_run.created event
    await octokit.checks.create({
      owner,
      repo,
      name: workflow.checkRunName,
      head_sha: checkSuite.head_sha,
      status: "queued",
      started_at: new Date().toISOString(),
      output: {
        title: "⏱️ Queued",
        summary:
          summaryPrefix +
          `The **[workflow](${workflowUrl})** is currently queued.`,
        details_url: workflowUrl,
      },
    });
  });

  /**
   * When a workflow is completed:
   * - update the associated check run with the conclusion
   */
  app.on("workflow_run.completed", async (context) => {
    const { payload, octokit } = context;

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);

    if (workflowFile !== workflow.file) return;

    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });
    // Sync the check_run with the conclusion of the workflow
    const checkRuns = await getCheckRunByName({
      octokit,
      owner,
      repo,
      ref: checkSuite.head_sha,
      checkName: workflow.checkRunName,
    });
    if (checkRuns.data.total_count === 0) {
      return;
    }

    let summary = `The **[workflow run](${payload.workflow_run.html_url})** has completed with status \`${payload.workflow_run.conclusion}\`.`;
    let defaultSummary = true;
    let actions;
    let annotations;
    if (workflow.summaryFile) {
      // Get the summary artifact
      const artifacts = await listWorkflowRunArtifacts(
        octokit,
        owner,
        repo,
        payload.workflow_run.id
      );

      const artifactId = artifacts.find(
        (artifact) => artifact.name === workflow.summaryFile
      )?.id;

      if (artifactId) {
        try {
          const rawSummary = await downloadArtifact(
            octokit,
            owner,
            repo,
            artifactId
          );
          const newSummary = JSON.parse(rawSummary.toString());
          if (newSummary.summary) {
            summary = newSummary?.summary;
            defaultSummary = false;
          }
          actions = newSummary?.actions;
          annotations = newSummary?.annotations;
        } catch (e) {
          context.log.error(
            `[Monitoring Workflow](downloadArtifact) Error while downloading / parsing artifact: ${workflow.summaryFile} @ artifactId: ${artifactId} & workflow_run.id: ${payload.workflow_run.id}`
          );
          context.log.error(e as Error);
        }
      }
    }

    const summaryPrefix = workflow.description
      ? `#### ${workflow.description}${
          !defaultSummary
            ? `\n##### [🔗 Workflow run](${payload.workflow_run.html_url})`
            : ""
        }\n\n`
      : "";
    summary = summaryPrefix + summary;

    const checkRun = checkRuns.data.check_runs[0];
    const output = getGenericOutput(payload.workflow_run.conclusion, summary);

    const tipsFile = workflowFile.replace(".yml", ".md");
    const p = path.join(__dirname, "..", "..", "..", "tips", tipsFile);
    let tips;

    try {
      const res = await fs.readFile(p, "utf-8");
      tips = res;
    } catch (error) {
      // ignore error, file is not found
    }

    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.id,
      status: "completed",
      conclusion: payload.workflow_run.conclusion,
      output: {
        ...output,
        text: tips,
      },
      completed_at: new Date().toISOString(),
      actions,
    });

    // Batch annotations to avoid hitting the API rate limit.
    // "The Checks API limits the number of annotations to a maximum of 50 per API request.
    // To create more than 50 annotations, you have to make multiple requests to the Update a check run endpoint.
    // Each time you update the check run, annotations are appended to the list of annotations that already exist for the check run."
    // See: https://docs.github.com/en/rest/checks/runs#update-a-check-run
    while (annotations && annotations.length > 0) {
      const batch = annotations.splice(0, 50);
      await octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        output: {
          ...output,
          annotations: batch,
          text: tips,
        },
      });
    }
  });

  /**
   * When a workflow is re-run, or the first time it gets in progress:
   * - Re-create the check run (unfortunately rerequested does not reset the status to "queued")
   * - Update the fields to reflect the fact that the run is in progress and link the workflow
   */
  app.on("workflow_run", async (context) => {
    const { payload, octokit } = context;

    context.log.debug(
      `[Monitoring Workflow](workflow_run.${payload.action}) ${payload.workflow_run.name}`
    );

    // @ts-expect-error Expected because probot does not declare this webhook event even though it exists.
    if (context.payload.action !== "in_progress") return;

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);

    if (workflow.file !== workflowFile) return;

    context.log.info(
      `[Monitoring Workflow](workflow_run.in_progress) ${payload.workflow_run.name}`
    );

    // Ensure that the latest workflow run status is "in progress"
    // Why? Because github might send the "in progress" event AFTER the "completed" event…
    const workflowRun = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: payload.workflow_run.id,
    });

    if (workflowRun.data.status !== "in_progress") {
      context.log.info(
        `[Monitoring Workflow](workflow_run.in_progress) The workflow run seems to be completed already, skipping…`
      );
      // Oops, the workflow is not in progress anymore, we should not update the check run
      return;
    }

    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });

    const workflowUrl = `https://github.com/${owner}/${repo}/actions/runs/${payload.workflow_run.id}`;
    const summaryPrefix = workflow.description
      ? `#### ${workflow.description}\n\n`
      : "";
    // Will trigger the check_run.created event
    await createRunByName({
      octokit,
      owner,
      repo,
      sha: checkSuite.head_sha,
      checkName: workflow.checkRunName,
      extraFields: {
        details_url: workflowUrl,
        output: {
          title: "⚙️ Running",
          summary:
            summaryPrefix +
            `The **[workflow](${workflowUrl})** is currently running.`,
        },
      },
    });
  });

  /**
   * When a check run is rerequested:
   * - trigger the related workflow
   */
  app.on(["check_run.rerequested"], async (context) => {
    const { payload, octokit } = context;

    const { owner, repo } = context.repo();

    if (workflow.checkRunName === payload.check_run.name) {
      octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflow.file,
        ref: payload.check_run.pull_requests[0]?.head.ref,
        inputs: workflow.getInputs(payload),
      });
    }
  });
}
