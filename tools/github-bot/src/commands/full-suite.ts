import { Probot, Context } from "probot";
import { monitorWorkflow } from "../tools/monitorWorkflow";
import { commands } from "./tools";

// Keep this in sync with the workflow file
const ACTION_ID = "lld_full_suite";

/**
 * Slash command `/full-lld-tests`
 * Run the full e2e test suite on LLD
 *
 * @param app The Probot application.
 */
export function runDesktopTestSuite(app: Probot) {
  async function triggerWorkflow({
    context,
    login,
    full,
  }: {
    context: Context<"issue_comment.created" | "check_run.requested_action">;
    login: string;
    full?: boolean;
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
      workflow_id: "test-desktop.yml",
      ref,
      inputs: {
        login,
        // @ts-expect-error weird behavior with boolean values
        "full-tests": full,
      },
    });
  }

  commands(app, "full-lld-tests", async (context, _data) => {
    const { payload } = context;

    if (context.isBot) return;

    await triggerWorkflow({
      context,
      login: `${payload.comment.user.login}`,
      full: true,
    });
  });

  // @ts-expect-error ts pls
  app.on("check_run.requested_action", async context => {
    const { payload } = context;

    if (payload.requested_action.identifier !== ACTION_ID) return;

    const login = payload.sender.login;

    await triggerWorkflow({
      context,
      login,
      full: true,
    });
  });

  monitorWorkflow(app, {
    file: "test-desktop.yml",
    checkRunName: "@Desktop • Test App",
    description:
      "Perform [end to end](https://playwright.dev/) and [unit](https://jestjs.io/fr/) tests, [type checks](https://www.typescriptlang.org/) and run the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    summaryFile: "summary.json",
    getInputs: payload => ({
      ref: payload.check_run.head_sha,
      login: payload.sender.login,
    }),
  });
}
