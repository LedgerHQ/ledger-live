import { Probot } from "probot";
import { commands } from "./tools";

/**
 * Slash commands `/regen-pods`
 * regenerates iOS podlock file
 *
 * @param app The Probot application.
 */
export function regenPods(app: Probot) {
  commands(app, "regen-pods", async (context, data) => {
    const { octokit, payload } = context;

    if (context.isBot) return;

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: context.payload.comment.id,
      content: "rocket",
    });

    await octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "regen-pods.yml",
      ref: "develop",
      inputs: {
        number: `${data.number}`,
        login: `${payload.comment.user.login}`,
      },
    });
  });
}
