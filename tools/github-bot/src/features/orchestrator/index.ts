import { Probot } from "probot";
import {
  WATCHER_CHECK_RUN_NAME,
  PullRequestMetadata,
  RUNNERS,
  WORKFLOWS,
  REPO_OWNER,
  REF_PREFIX,
  SYNC_ACTION,
  WorkflowRunPayload,
} from "./const";
import {
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
  getGenericOutput,
  createRunByName,
  listWorkflowRunArtifacts,
} from "../../tools";
import { prIsFork, updateWatcherCheckRun, getTips } from "./tools";

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

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.requested) ${payload.workflow_run.name}`
      );
      const workflowUrl = payload.workflow_run.html_url;
      const summaryPrefix = matchedWorkflow.description
        ? `#### ${matchedWorkflow.description}\n\n`
        : "";

      const { data: checkSuite } = await octokit.checks.getSuite({
        owner,
        repo,
        check_suite_id: payload.workflow_run.check_suite_id,
      });

      // Will trigger the check_run.created event (which will update the watcher)
      context.log.info(
        `[Orchestrator](workflow_run.requested) Creating check run ${matchedWorkflow.checkRunName} @sha ${checkSuite.head_sha}`
      );

      const response = await octokit.checks.create({
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
      context.log.info(
        `[Orchestrator](workflow_run.requested) Check run created @id ${response.data.id}`
      );
    }
  });

  /**
   * When a workflow is re-run, or the first time it gets in progress:
   * - Re-create the check run (unfortunately rerequested does not reset the status to "queued")
   * - Update the fields to reflect the fact that the run is in progress and link the workflow
   */
  app.on("workflow_run", async (context) => {
    const { payload, octokit } = context;

    // @ts-expect-error Expected because probot does not declare this webhook event even though it exists.
    if (context.payload.action !== "in_progress") return;

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.in_progress) ${payload.workflow_run.name}`
      );
      const workflowUrl = payload.workflow_run.html_url;
      const summaryPrefix = matchedWorkflow.description
        ? `#### ${matchedWorkflow.description}\n\n`
        : "";
      const tipsPromise = getTips(workflowFile);

      // Ensure that the latest workflow run status is "in progress"
      // Why? Because github might send the "in progress" event AFTER the "completed" event…
      const workflowRunPromise = octokit.actions.getWorkflowRun({
        owner,
        repo,
        run_id: payload.workflow_run.id,
      });

      const [tips, workflowRun] = await Promise.all([
        tipsPromise,
        workflowRunPromise,
      ]);

      if (workflowRun.data.status !== "in_progress") {
        context.log.info(
          `[Orchestrator](workflow_run.in_progress) The workflow run seems to be completed already, skipping…`
        );
        // Oops, the workflow is not in progress anymore, we should not update the check run
        return;
      }

      const { data: checkSuite } = await octokit.checks.getSuite({
        owner,
        repo,
        check_suite_id: payload.workflow_run.check_suite_id,
      });

      context.log.info(
        `[Orchestrator](workflow_run.in_progress) Creating check run ${matchedWorkflow.checkRunName} @sha ${checkSuite.head_sha}`
      );

      // Will trigger the check_run.created event (which will update the watcher)
      const response = await createRunByName({
        octokit,
        owner,
        repo,
        sha: checkSuite.head_sha,
        checkName: matchedWorkflow.checkRunName,
        //payload.workflow_run.updated_at
        extraFields: {
          details_url: workflowUrl,
          actions: [
            {
              // 20 chars max
              label: "Sync Status",
              // 20 chars max
              identifier: SYNC_ACTION,
              // 40 chars max
              description: "Refresh the status of the check",
            },
          ],
          output: {
            title: "⚙️ Running",
            summary:
              summaryPrefix +
              `The **[workflow](${workflowUrl})** is currently running.`,
            text: tips,
          },
        },
      });
      context.log.info(
        `[Orchestrator](workflow_run.in_progress) Check run created @id ${response.id}`
      );
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

    if (workflowFile === "gate.yml") {
      if (payload.workflow_run.conclusion !== "success") return;

      context.log.info(
        `[Orchestrator](workflow_run.completed) ${payload.workflow_run.name}`
      );

      const artifacts = await listWorkflowRunArtifacts(
        octokit,
        owner,
        repo,
        payload.workflow_run.id
      );

      context.log.info(
        `[Orchestrator](workflow_run.completed) Linked artifacts ${artifacts.map(
          (a) =>
            JSON.stringify({
              name: a.name,
              id: a.id,
              created_at: a.created_at,
              expires_at: a.expires_at,
            })
        )}`
      );

      // Get the affected / metadata artifacts
      const [affected, metadata] = (await Promise.all(
        ["affected.json", "pr_metadata.json"].map(
          async (
            fileName: string
          ): Promise<
            Record<string, { path: string }> | PullRequestMetadata | undefined
          > => {
            const artifactId = artifacts.find(
              (artifact) => artifact.name === fileName
            )?.id;

            context.log.info(
              `[Orchestrator](workflow_run.completed) Found artifact ${fileName} @id ${artifactId}`
            );

            if (!artifactId) return undefined;

            try {
              const raw = await downloadArtifact(
                octokit,
                owner,
                repo,
                artifactId
              );
              return JSON.parse(raw.toString());
            } catch (e) {
              context.log.error(
                `[Orchestrator](workflow_run.completed) Error while downloading / parsing artifact: ${fileName} @ artifactId: ${artifactId} & workflow_run.id: ${payload.workflow_run.id}`
              );
              context.log.error(e as Error);
              return undefined;
            }
          }
        )
      )) as [Record<string, { path: string }>?, PullRequestMetadata?];
      const baseOwner = metadata?.base_owner || REPO_OWNER;

      const isFork =
        metadata?.is_fork ??
        (await prIsFork(
          octokit,
          repo,
          owner,
          metadata?.number || payload.workflow_run.pull_requests[0]?.number
        ));

      context.log.info(
        `[Orchestrator](workflow_run.completed) Is pull requests from a forked repo? ${isFork}`
      );

      const { data: checkSuite } = await octokit.checks.getSuite({
        owner,
        repo,
        check_suite_id: payload.workflow_run.check_suite_id,
      });

      let affectedWorkflows = 0;
      let localRef = `forked/${checkSuite.head_sha}`;

      if (isFork) {
        try {
          const { data, status } = await octokit.rest.git.createRef({
            owner: baseOwner,
            repo,
            sha: checkSuite.head_sha,
            ref: `${REF_PREFIX}/${localRef}`,
          });
          context.log.warn(
            `[Orchestrator](workflow_run.completed) created a ref "${data.ref}" on sha "${data.object.sha}" for forked PR (${status})`
          );
        } catch (error) {
          context.log.warn(
            `[Orchestrator](workflow_run.completed) createRef ${localRef} error: ${error}`
          );
        }
      }

      // For each workflow…
      await Promise.all(
        Object.entries(WORKFLOWS).map(async ([fileName, workflow]) => {
          if (isFork && workflow.runsOn === RUNNERS.internal) return;
          if (!isFork && workflow.runsOn === RUNNERS.external) return;
          // Determine if the workflow is affected
          const isAffected =
            !affected ||
            workflow.affected.some((specifier) => {
              return typeof specifier === "string"
                ? affected[specifier]
                : Object.values(affected).some(({ path }: { path: string }) =>
                    specifier.test(path)
                  );
            });
          if (isAffected) {
            affectedWorkflows++;
            const workflowRef =
              metadata?.head_branch ||
              payload.workflow_run.pull_requests[0]?.head.ref;
            const workflowInputs = workflow.getInputs(payload, metadata);
            context.log.info(
              `[Orchestrator](workflow_run.completed) Dispatching workflow ${fileName} on ref ${workflowRef} with inputs ${JSON.stringify(
                workflowInputs
              )}`
            );

            // Trigger the associated workflow.
            // This will trigger the workflow_run.requested event,
            // which will create/recreate the check run and update the watcher.
            const response = await octokit.actions.createWorkflowDispatch({
              owner: baseOwner,
              repo,
              workflow_id: fileName,
              ref: isFork ? localRef : workflowRef,
              inputs: workflow.getInputs(
                payload,
                metadata,
                isFork ? localRef : undefined
              ),
            });
            context.log.info(
              `[Orchestrator](workflow_run.completed) Dispatched workflow run response @status ${response.status}`
            );
          }
        })
      );

      // Create or recreate the Watcher check run
      const checkRun = await createRunByName({
        octokit,
        owner: baseOwner,
        repo,
        sha: checkSuite.head_sha,
        checkName: WATCHER_CHECK_RUN_NAME,
      });

      context.log.info(
        `[Orchestrator](workflow_run.completed) Created watcher check run @name ${checkRun.name} @id ${checkRun.id}`
      );

      // If there are no affected workflows, update the watcher to success.
      if (checkRun && affectedWorkflows < 1) {
        context.log.info(
          `[Orchestrator](workflow_run.completed) No affected workflows, updating watcher to success`
        );
        await octokit.checks.update({
          owner: baseOwner,
          repo,
          check_run_id: checkRun.id,
          status: "completed",
          conclusion: "success",
        });
      }
    } else if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](workflow_run.completed) ${payload.workflow_run.name}`
      );

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
        checkName: matchedWorkflow.checkRunName,
      });

      context.log.info(
        `[Orchestrator](workflow_run.completed) Found ${
          checkRuns.data.total_count
        } check runs named ${matchedWorkflow.checkRunName} @sha ${
          checkSuite.head_sha
        }\n${checkRuns.data.check_runs.map((cr) => cr.id)}`
      );

      if (checkRuns.data.total_count === 0) {
        return;
      }

      let summary = `The **[workflow run](${payload.workflow_run.html_url})** has completed with status \`${payload.workflow_run.conclusion}\`.`;
      let defaultSummary = true;
      let actions;
      let annotations;
      if (matchedWorkflow.summaryFile) {
        // Get the summary artifact
        const artifacts = await listWorkflowRunArtifacts(
          octokit,
          owner,
          repo,
          payload.workflow_run.id
        );

        const artifactId = artifacts.find(
          (artifact) => artifact.name === matchedWorkflow.summaryFile
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
              `[Orchestrator](workflow_run.completed) Error while downloading / parsing artifact: ${matchedWorkflow.summaryFile} @ artifactId: ${artifactId} & workflow_run.id: ${payload.workflow_run.id}`
            );
            context.log.error(e as Error);
          }
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

      context.log.info(
        `[Orchestrator](workflow_run.completed) Updating check run: ${checkRun.name} @id ${checkRun.id}`
      );

      const updateRes = await octokit.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        status: "completed",
        conclusion: payload.workflow_run.conclusion,
        output: {
          ...output,
          text: tips,
        },
        completed_at: payload.workflow_run.updated_at,
        actions,
      });

      context.log.info(
        `[Orchestrator](workflow_run.completed) Check run updated: ${updateRes.data.name} @status ${updateRes.data.status} @conclusion ${updateRes.data.conclusion}`
      );

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
   * - Create the watcher check run
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
        `[Orchestrator](check_run.created) ${payload.check_run.name} @sha ${payload.check_run.head_sha} @id ${payload.check_run.id} @url ${payload.check_run.html_url}`
      );
      // (Re)Create watcher check run in pending state
      const response = await createRunByName({
        octokit,
        owner,
        repo,
        sha: payload.check_run.head_sha,
        checkName: WATCHER_CHECK_RUN_NAME,
      });
      context.log.info(
        `[Orchestrator](check_run.created) Created watcher check run @id ${response.id}`
      );
      const result = await updateWatcherCheckRun(
        octokit,
        owner,
        repo,
        payload.check_run.head_sha
      );
      if (result) {
        context.log.info(
          `[Orchestrator](check_run.created) Synchronized watcher @id ${result.data.id}`
        );
      } else {
        context.log.error(
          `[Orchestrator](check_run.created) Unable to update watcher check run @sha ${payload.check_run.head_sha}`
        );
      }
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
      context.log.info(
        `[Orchestrator](check_run.rerequested) ${payload.check_run.name} @workflow ${workflowName} @sha ${payload.check_run.head_sha} @id ${payload.check_run.id} @url ${payload.check_run.html_url}`
      );
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
   * - Update the watcher with the right status based on the other check runs of the suite
   */
  app.on("check_run.completed", async (context) => {
    const { payload, octokit } = context;

    const { owner, repo } = context.repo();
    const matchedWorkflow = Object.values(WORKFLOWS).find(
      (w) => w.checkRunName === payload.check_run.name
    );

    if (matchedWorkflow) {
      context.log.info(
        `[Orchestrator](check_run.completed) ${payload.check_run.name} @sha ${payload.check_run.head_sha} @id ${payload.check_run.id} @url ${payload.check_run.html_url}`
      );
      const result = await updateWatcherCheckRun(
        octokit,
        owner,
        repo,
        payload.check_run.head_sha
      );
      if (result) {
        context.log.info(
          `[Orchestrator](check_run.completed) Synchronized watcher @id ${result.data.id}`
        );
      } else {
        context.log.error(
          `[Orchestrator](check_run.completed) Unable to update watcher check run @sha ${payload.check_run.head_sha}`
        );
      }
    }
  });

  /**
   * When a check run sync action is sent:
   * - Update the check run and the watcher with the right status based on the other check runs of the suite
   */
  app.on("check_run.requested_action", async (context) => {
    const { payload, octokit } = context;

    if (payload.requested_action.identifier !== SYNC_ACTION) return;

    context.log.info(
      `[Orchestrator](check_run.requested_action) Running requested action: ${SYNC_ACTION}`
    );

    /**
     * Get workflow for given sha filtered by match on Workflow
     * Update check run with correct status.
     */
    const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
      ...context.repo(),
      head_sha: payload.check_run.head_sha,
      exclude_pull_requests: true,
      event: "workflow_dispatch",
    });

    const workflowMeta = Object.entries(WORKFLOWS).find(
      ([, w]) => w.checkRunName === payload.check_run.name
    );

    if (!workflowMeta) {
      context.log.info(
        `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) Could not find a workflow run for ${payload.check_run.name}`
      );
      return;
    }

    const workflowRun = data.workflow_runs.reduce<
      WorkflowRunPayload["workflow_run"] | undefined
    >((wf, curr) => {
      if ((curr as any).path === ".github/workflows/" + workflowMeta[0]) {
        if (!wf || wf.run_attempt < (curr?.run_attempt ?? 1)) {
          return curr as WorkflowRunPayload["workflow_run"];
        }
      }
      return wf;
    }, undefined);

    if (!workflowRun) {
      context.log.info(
        `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) Could not find a workflow run for ${workflowMeta[0]}`
      );
      return;
    }

    if (workflowRun.status === "in_progress") {
      context.log.info(
        `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) The workflow run seems to be running still, no updates to check run`
      );
      // The workflow is still running, we should not update the check run
      return;
    }

    if (workflowRun.status === "completed") {
      // The workflow has completed, let's sync the state
      let summary = `The **[workflow run](${workflowRun.html_url})** has completed with status \`${workflowRun.conclusion}\`.`;
      let defaultSummary = true;
      let actions;
      let annotations;
      const { repo, owner } = context.repo();
      if (workflowMeta[1].summaryFile) {
        // Get the summary artifact

        const artifacts = await listWorkflowRunArtifacts(
          octokit,
          owner,
          repo,
          workflowRun.id
        );

        const artifactId = artifacts.find(
          (artifact) => artifact.name === workflowMeta[1].summaryFile
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
              `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) Error while downloading / parsing artifact: ${workflowMeta[1].summaryFile} @ artifactId: ${artifactId} & workflow_run.id: ${workflowRun.id}`
            );
            context.log.error(e as Error);
          }
        }
      }

      const summaryPrefix = workflowMeta[1].description
        ? `#### ${workflowMeta[1].description}${
            !defaultSummary
              ? `\n##### [🔗 Workflow run](${workflowRun.html_url})`
              : ""
          }\n\n`
        : "";
      summary = summaryPrefix + summary;

      // const checkRun = checkRuns.data.check_runs[0];
      const output = getGenericOutput(workflowRun?.conclusion ?? "", summary);
      const tips = await getTips(workflowMeta[0]);

      context.log.info(
        `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) Updating check run: ${payload.check_run.name} @id ${payload.check_run.id}`
      );

      const updateRes = await octokit.checks.update({
        owner,
        repo,
        check_run_id: payload.check_run.id,
        status: "completed",
        conclusion: workflowRun.conclusion,
        output: {
          ...output,
          text: tips,
        },
        completed_at: workflowRun.updated_at,
        actions,
      });

      context.log.info(
        `[Orchestrator](check_run.requested_action)(${SYNC_ACTION}) Check run updated: ${updateRes.data.name} @status ${updateRes.data.status} @conclusion ${updateRes.data.conclusion}`
      );

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
          check_run_id: payload.check_run.id,
          output: {
            ...output,
            annotations: batch,
            text: tips,
          },
        });
      }
    }
  });
}
