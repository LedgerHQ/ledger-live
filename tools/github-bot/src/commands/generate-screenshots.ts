import { Probot, Context } from "probot";
import { monitorWorkflow } from "../tools/monitorWorkflow";
import { commands } from "./tools";

// Keep this in sync with the workflow file
const ACTION_ID = "regen_screenshots";

/**
 * Slash command `/generate-screenshots`
 * generate a new set of playwright screenshots
 *
 * @param app The Probot application.
 */
export function generateScreenshots(app: Probot) {
  async function triggerWorkflow({
    context,
    number,
    login,
    commentId,
  }: {
    context: Context<"issue_comment.created" | "check_run.requested_action">;
    number: string;
    login: string;
    commentId?: number;
  }) {
    const { payload } = context;
    let ref;
    if ("check_run" in payload) {
      ref = payload.check_run.pull_requests[0]?.base.ref;
    } else {
      const { data: prData } = await context.octokit.rest.pulls.get({
        ...context.repo(),
        pull_number: payload.issue.number,
      });
      ref = prData.head.repo?.fork ? prData.base.ref : prData.head.ref;
    }

    return context.octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "generate-screenshots.yml",
      ref,
      inputs: {
        number,
        login,
        ...(commentId ? { commentId: `${commentId}` } : {}),
      },
    });
  }

  commands(app, "generate-screenshots", async (context, data) => {
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
    file: "generate-screenshots.yml",
    checkRunName: "@Desktop • Generate Screenshots",
    description:
      "Regenerates playwright screenshots for the Live Desktop app and commit the changes.",
    summaryFile: "summary.json",
    getInputs: (payload) => ({
      ref: payload.check_run.head_sha,
      login: payload.sender.login,
    }),
  });
}
