import { Probot } from "probot";
import { commands } from "./tools";

/**
 * Slash command `/generate-screenshots`
 * generate a new set of playwright screenshots
 *
 * @param app The Probot application.
 */
export function generateScreenshots(app: Probot) {
  commands(app, "generate-screenshots", async (context, data) => {
    const { octokit, payload } = context;

    if (context.isBot) return;

    await octokit.rest.reactions.createForIssueComment({
      ...context.repo(),
      comment_id: context.payload.comment.id,
      content: "rocket",
    });

    await octokit.actions.createWorkflowDispatch({
      ...context.repo(),
      workflow_id: "generate-screenshots.yml",
      ref: "develop",
      inputs: {
        number: `${data.number}`,
        login: `${payload.comment.user.login}`,
      },
    });
  });
}
