import { Context, Probot } from "probot";
import { commands, monitorWorkflow } from "./tools";

// Keep this in sync with the workflow file
const ACTION_ID = "regen_pods";

/**
 * Slash commands `/regen-pods`
 * regenerates iOS podlock file
 *
 * @param app The Probot application.
 */
export function regenPods(app: Probot) {
  async function triggerWorkflow({
    context,
    number,
    login,
    commentId,
  }: {
    context: Context;
    number: string;
    login: string;
    comment?: boolean;
    commentId?: number;
  }) {
    await context.octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "regen-pods.yml",
      // ref: "develop",
      ref: "support/granular-ci",
      inputs: {
        number,
        login,
        ...(commentId ? { commentId: `${commentId}` } : {}),
      },
    });
  }

  commands(app, "regen-pods", async (context, data) => {
    const { payload } = context;

    if (context.isBot) return;

    await triggerWorkflow({
      context,
      number: `${data.number}`,
      login: `${payload.comment.user.login}`,
      commentId: data?.commentId,
    });
  });

  app.on("check_run.requested_action", async (context) => {
    const { payload } = context;

    if (payload.requested_action.identifier !== ACTION_ID) return;

    const number = payload.check_run.pull_requests[0]?.number;
    const login = payload.sender.login;

    if (!number) return;

    await triggerWorkflow({
      context,
      number: `${number}`,
      login,
    });
  });

  monitorWorkflow(app, {
    file: "regen-pods.yml",
    checkRunName: "@Mobile • Regen Pods",
    description: "Regenerates iOS podlock file",
    summaryFile: "summary.json",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
      };
    },
  });
}
