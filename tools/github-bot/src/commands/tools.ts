import fs from "fs/promises";
import path from "path";
import { Probot } from "probot";
import {
  createRunByName,
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
} from "../tools";

/**
 *  commands is a helper to wrap the validation of some text from issues commented on PR and PR messages
 *  so we can trigger specific actions
 */
export const commands = (
  app: Probot,
  name: string,
  // arguments is a string of arguments separated by a comma ","
  callback: (
    context: any,
    data: {
      number: number;
      name: string;
      arguments?: string;
      commentId?: number;
    }
  ) => {}
) => {
  const matcher = /^\/([\w-]+)\b *(.*)?$/m;

  app.on(["issue_comment.created" /*, "issues.opened" */], async (context) => {
    if (context.isBot) return;

    const { payload, octokit } = context;
    const isPR = (issue: any) => issue.pull_request !== undefined;

    const issue = payload.issue;
    const comment = payload.comment;
    const command = comment.body.match(matcher);

    if (!isPR(issue)) return;
    if (!command || (command && command[1] !== name)) return;

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: comment.id,
      content: "rocket",
    });

    return callback(context, {
      number: issue.number,
      name: command[1],
      arguments: command[2],
      commentId: comment.id,
    });
  });
};

type WorkflowDescriptor = {
  file: string;
  checkRunName: string;
  description?: string;
  summaryFile?: string;
  getInputs: <P>(payload: P) => Record<string, any>;
};
export function monitorWorkflow(app: Probot, workflow: WorkflowDescriptor) {
  // on check run rerequested -> retrigger workflow

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

    if (workflowFile === workflow.file) {
      context.log.info(
        `[Monitoring Workflow](workflow_run.requested) ${payload.workflow_run.name}`
      );
      // Will trigger the check_run.created event (which will update the gate)
      await octokit.checks.create({
        owner,
        repo,
        name: workflow.checkRunName,
        head_sha: payload.workflow_run.head_sha,
        status: "queued",
        started_at: new Date().toISOString(),
      });
    }
  });

  /**
   * When a workflow is completed:
   * - update the associated check run with the conclusion
   */
  app.on("workflow_run.completed", async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);

    if (workflowFile === workflow.file) {
      // Sync the check_run with the conclusion of the workflow
      const checkRuns = await getCheckRunByName({
        octokit,
        owner,
        repo,
        ref: payload.workflow_run.head_sha,
        checkName: workflow.checkRunName,
      });
      if (checkRuns.data.total_count === 0) {
        return;
      }

      let summary = `The **[workflow run](${payload.workflow_run.html_url})** has completed with status \`${payload.workflow_run.conclusion}\`.`;
      let actions;
      let annotations;
      if (workflow.summaryFile) {
        // Get the summary artifact
        const artifacts = await octokit.actions.listWorkflowRunArtifacts({
          owner,
          repo,
          run_id: payload.workflow_run.id,
        });

        const artifactId = artifacts.data.artifacts.find(
          (artifact) => artifact.name === workflow.summaryFile
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
          }
          actions = newSummary?.actions;
          annotations = newSummary?.annotations;
        }
      }

      const summaryPrefix = workflow.description
        ? `#### ${workflow.description}\n\n`
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
          },
        });
      }
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

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);

    if (workflow.file === workflowFile) {
      context.log.info(
        `[Monitoring Workflow](workflow_run.in_progress) ${payload.workflow_run.name}`
      );
      const workflowUrl = `https://github.com/${owner}/${repo}/actions/runs/${payload.workflow_run.id}`;
      const summaryPrefix = workflow.description
        ? `#### ${workflow.description}\n\n`
        : "";
      // Will trigger the check_run.created event (which will update the gate)
      await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: workflow.checkRunName,
        extraFields: {
          details_url: workflowUrl,
          output: {
            title: "⚙️ Running",
            summary:
              summaryPrefix +
              `The **[workflow](${workflowUrl})** is currently running.`,
            started_at: new Date().toISOString(),
          },
        },
      });
    }
  });

  /**
   * When a check run is rerequested:
   * - trigger the related workflow
   */
  app.on(["check_run.rerequested"], async (context) => {
    const { payload, octokit } = context;

    /* ⚠️ TEMP */
    if (payload.check_run.pull_requests.every((pr) => pr.number !== 1991))
      return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();

    if (workflow.checkRunName === payload.check_run.name) {
      octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflow.file,
        ref: payload.check_run.head_sha,
        inputs: workflow.getInputs(payload),
      });
    }
  });
}
