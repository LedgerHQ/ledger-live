import { Probot } from "probot";
import { GATE_CHECK_RUN_NAME, WORKFLOWS } from "./const";
import {
  createOrRerequestRunByName,
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
  updateGateCheckRun,
} from "./tools";

/**
 * Orchestrates workflows.
 *
 * @param app The Probot application.
 */
export function orchestrator(app: Probot) {
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
      // Create the related check run.
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
      // Create or retrigger the related check run
      await createOrRerequestRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: matchedWorkflow.checkRunName,
        updateToPendingFields: {
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

  app.on("workflow_run.completed", async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (workflowFile === "gate.yml") {
      context.log.info(
        `[Orchestrator](workflow_run.completed) ${payload.workflow_run.name}`
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
      // For each workflow
      Object.entries(WORKFLOWS).forEach(([fileName, workflow]) => {
        const isAffected = workflow.affected.some((pkg) => affected.has(pkg));
        if (isAffected) {
          affectedWorkflows++;
          octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: fileName,
            ref: payload.workflow_run.head_branch,
            inputs: workflow.getInputs(payload),
          });
        }
      });

      const checkRun = await createOrRerequestRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
      });

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
      // Update the related check run
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
      await octokit.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        status: "completed",
        conclusion: payload.workflow_run.conclusion,
        output: getGenericOutput(payload.workflow_run.conclusion), // TODO: add proper output
        completed_at: new Date().toISOString(),
      });
    }
  });

  app.on(["check_run.created", "check_run.rerequested"], async (context) => {
    // Create + update gate check run in pending state
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
        `[Orchestrator](check_run.created / check_run.rerequested) ${payload.check_run.name}`
      );
      // Create or retrigger the related check run
      await createOrRerequestRunByName({
        octokit,
        owner,
        repo,
        sha: payload.check_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
        updateToPendingFields: {
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
