import { Probot } from "probot";
import { GATE_CHECK_RUN_NAME, RUNNERS, WORKFLOWS } from "./const";
import {
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
  createRunByName,
} from "../../tools";
import { prIsFork, updateGateCheckRun, getTips } from "./tools";

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

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];
    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.requested) ${payload.workflow_run.name}`
      );
      const workflowUrl = payload.workflow_run.html_url;
      const summaryPrefix = matchedWorkflow.description
        ? `#### ${matchedWorkflow.description}\n\n`
        : "";
      // Will trigger the check_run.created event (which will update the gate)
      await octokit.checks.create({
        owner,
        repo,
        name: matchedWorkflow.checkRunName,
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

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];
    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.in_progress) ${payload.workflow_run.name}`
      );
      const workflowUrl = payload.workflow_run.html_url;
      const summaryPrefix = matchedWorkflow.description
        ? `#### ${matchedWorkflow.description}\n\n`
        : "";
      const tips = await getTips(workflowFile);

      // Will trigger the check_run.created event (which will update the gate)
      await createRunByName({
        octokit,
        owner,
        repo,
        sha: checkSuite.head_sha,
        checkName: matchedWorkflow.checkRunName,
        extraFields: {
          details_url: workflowUrl,
          output: {
            title: "⚙️ Running",
            summary:
              summaryPrefix +
              `The **[workflow](${workflowUrl})** is currently running.`,
            text: tips,
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

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];
    const { data: checkSuite } = await octokit.checks.getSuite({
      owner,
      repo,
      check_suite_id: payload.workflow_run.check_suite_id,
    });

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
      const affected: Record<string, { path: string }> = JSON.parse(
        rawAffected.toString()
      );

      let affectedWorkflows = 0;
      // For each workflow…
      Object.entries(WORKFLOWS).forEach(([fileName, workflow]) => {
        if (isFork && workflow.runsOn === RUNNERS.internal) return;
        if (!isFork && workflow.runsOn === RUNNERS.external) return;
        // Determine if the workflow is affected
        const isAffected = workflow.affected.some((specifier) => {
          return typeof specifier === "string"
            ? affected[specifier]
            : Object.values(affected).some(({ path }: { path: string }) =>
                specifier.test(path)
              );
        });
        if (isAffected) {
          affectedWorkflows++;
          // Trigger the associated workflow.
          // This will trigger the workflow_run.requested event,
          // which will create/recreate the check run and update the gate.
          octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: fileName,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            inputs: workflow.getInputs(payload),
          });
        }
      });

      // Create or recreate the Gate check run
      const checkRun = await createRunByName({
        octokit,
        owner,
        repo,
        sha: checkSuite.head_sha,
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
        ref: checkSuite.head_sha,
        checkName: matchedWorkflow.checkRunName,
      });
      if (checkRuns.data.total_count === 0) {
        return;
      }

      let summary = `The **[workflow run](${payload.workflow_run.html_url})** has completed with status \`${payload.workflow_run.conclusion}\`.`;
      let defaultSummary = true;
      let actions;
      let annotations;
      if (matchedWorkflow.summaryFile) {
        // Get the summary artifact
        const artifacts = await octokit.actions.listWorkflowRunArtifacts({
          owner,
          repo,
          run_id: payload.workflow_run.id,
        });

        const artifactId = artifacts.data.artifacts.find(
          (artifact) => artifact.name === matchedWorkflow.summaryFile
        )?.id;

        if (artifactId) {
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
        }
      }

      const summaryPrefix = matchedWorkflow.description
        ? `#### ${matchedWorkflow.description}${
            !defaultSummary
              ? `\n##### [🔗 Workflow run](${payload.workflow_run.html_url})`
              : ""
          }\n\n`
        : "";
      summary = summaryPrefix + summary;

      const checkRun = checkRuns.data.check_runs[0];
      const output = getGenericOutput(payload.workflow_run.conclusion, summary);
      const tips = await getTips(workflowFile);

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
    }
  });

  /**
   * When a check run is created:
   * - Create the gate check run
   * - Update it with the right status based on the other check runs of the suite
   */
  app.on(["check_run.created"], async (context) => {
    const { payload, octokit } = context;

    const { owner, repo } = context.repo();
    const matchedWorkflow = Object.values(WORKFLOWS).find(
      (w) => w.checkRunName === payload.check_run.name
    );

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](check_run.created) ${payload.check_run.name}`
      );
      // (Re)Create gate check run in pending state
      await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.check_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
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
        ref: payload.check_run.pull_requests[0]?.head.ref,
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
