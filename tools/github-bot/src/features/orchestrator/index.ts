import { Probot } from "probot";
import { GATE_CHECK_RUN_NAME, RUNNERS, WORKFLOWS } from "./const";
import {
  createRunByName,
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
  prIsFork,
  updateGateCheckRun,
} from "./tools";

/**
 * Orchestrates workflows.
 *
 * @param app The Probot application.
 */
export function orchestrator(app: Probot) {
  /**
   * When a workflow is requested for the first time:
   *  - Create the related check run
   */
  app.on("workflow_run.requested", async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.requested) ${payload.workflow_run.name}`
      );
      // Will trigger the check_run.created event (which will update the gate)
      await octokit.checks.create({
        owner,
        repo,
        name: matchedWorkflow.checkRunName,
        head_sha: payload.workflow_run.head_sha,
        status: "queued",
        started_at: new Date().toISOString(),
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
      `[Orchestrator](workflow_run.${payload.action}) ${payload.workflow_run.name}`
    );

    // @ts-expect-error Expected because probot does not declare this webhook event even though it exists.
    if (context.payload.action !== "in_progress") return;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.in_progress) ${payload.workflow_run.name}`
      );
      const workflowUrl = `https://github.com/${owner}/${repo}/actions/runs/${payload.workflow_run.id}`;
      // Will trigger the check_run.created event (which will update the gate)
      await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: matchedWorkflow.checkRunName,
        extraFields: {
          details_url: workflowUrl,
          output: {
            title: "⚙️ Running",
            summary: `The **[workflow](${workflowUrl})** is currently running.`,
            started_at: new Date().toISOString(),
          },
        },
      });
    }
  });

  /**
   * When a workflow is completed:
   * - If the workflow is the gate, get the affected.json artifact and trigger the related workflows
   * - Otherwise, update the associated check run with the conclusion
   */
  app.on("workflow_run.completed", async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (workflowFile === "gate.yml") {
      if (payload.workflow_run.conclusion !== "success") return;

      context.log.info(
        `[Orchestrator](workflow_run.completed) ${payload.workflow_run.name}`
      );

      const isFork = await prIsFork(
        octokit,
        repo,
        owner,
        payload.workflow_run.pull_requests[0]?.number
      );

      // Get the artifact named affected.json
      const artifacts = await octokit.actions.listWorkflowRunArtifacts({
        owner,
        repo,
        run_id: payload.workflow_run.id,
      });

      const artifactId = artifacts.data.artifacts.find(
        (artifact) => artifact.name === "affected.json"
      )?.id;

      if (!artifactId) return;

      const rawAffected = await downloadArtifact(
        octokit,
        owner,
        repo,
        artifactId
      );
      const affected = new Set(JSON.parse(rawAffected.toString()));

      let affectedWorkflows = 0;
      // For each workflow…
      Object.entries(WORKFLOWS).forEach(([fileName, workflow]) => {
        if (isFork && workflow.runsOn === RUNNERS.internal) return;
        if (!isFork && workflow.runsOn === RUNNERS.external) return;
        // Determine if the workflow is affected
        const isAffected = workflow.affected.some((pkg) => affected.has(pkg));
        if (isAffected) {
          affectedWorkflows++;
          // Trigger the associated workflow.
          // This will trigger the workflow_run.requested event,
          // which will create/recreate the check run and update the gate.
          octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: fileName,
            ref: payload.workflow_run.head_branch,
            inputs: workflow.getInputs(payload),
          });
        }
      });

      // Create or recreate the Gate check run
      const checkRun = await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
      });

      // If there are no affected workflows, update the gate to success.
      if (checkRun && affectedWorkflows < 1) {
        await octokit.checks.update({
          owner,
          repo,
          check_run_id: checkRun.id,
          status: "completed",
          conclusion: "success",
        });
      }
    } else if (matchedWorkflow) {
      // Sync the check_run with the conclusion of the workflow
      const checkRuns = await getCheckRunByName({
        octokit,
        owner,
        repo,
        ref: payload.workflow_run.head_sha,
        checkName: matchedWorkflow.checkRunName,
      });
      if (checkRuns.data.total_count === 0) {
        return;
      }
      const checkRun = checkRuns.data.check_runs[0];
      const summary = `The **[workflow run](${payload.workflow_run.html_url})** has completed with status \`${payload.workflow_run.conclusion}\`.`;
      await octokit.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        status: "completed",
        conclusion: payload.workflow_run.conclusion,
        output: getGenericOutput(payload.workflow_run.conclusion, summary), // TODO: add proper output
        completed_at: new Date().toISOString(),
      });
    }
  });

  /**
   * When a check run is created:
   * - Create the gate check run
   * - Update it with the right status based on the other check runs of the suite
   */
  app.on(["check_run.created"], async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.check_run.pull_requests.every((pr) => pr.number !== 1991))
      return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const matchedWorkflow = Object.values(WORKFLOWS).find(
      (w) => w.checkRunName === payload.check_run.name
    );

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](check_run.created) ${payload.check_run.name}`
      );
      // Create + update gate check run in pending state
      await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.check_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
        extraFields: {
          started_at: new Date().toISOString(),
        },
      });
      await updateGateCheckRun(
        octokit,
        owner,
        repo,
        payload.check_run.head_sha
      );
    }
  });

  /**
   * When a check run is rerequested:
   * - Trigger the related workflow
   */
  app.on(["check_run.rerequested"], async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.check_run.pull_requests.every((pr) => pr.number !== 1991))
      return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflow = Object.entries(WORKFLOWS).find(
      ([, w]) => w.checkRunName === payload.check_run.name
    );

    if (workflow) {
      const [workflowName, workflowMeta] = workflow;
      octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowName,
        ref: payload.check_run.head_sha,
        inputs: workflowMeta.getInputs(payload),
      });
    }
  });

  /**
   * When a check run is completed:
   * - Update the gate with the right status based on the other check runs of the suite
   */
  app.on("check_run.completed", async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.check_run.pull_requests.every((pr) => pr.number !== 1991))
      return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const matchedWorkflow = Object.values(WORKFLOWS).find(
      (w) => w.checkRunName === payload.check_run.name
    );

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](check_run.completed) ${payload.check_run.name}`
      );
      await updateGateCheckRun(
        octokit,
        owner,
        repo,
        payload.check_run.head_sha
      );
    }
  });
}
