import { Probot } from "probot";
import {
  createOrRerequestRunByName,
  downloadArtifact,
  extractWorkflowFile,
  getCheckRunByName,
} from "./tools";

const BOT_APP_ID = 198164;
const GATE_CHECK_RUN_NAME = "The Balrog has been summoned ❤️‍🔥";

const WORKFLOWS = {
  "build-desktop.yml": {
    affected: ["ledger-live-desktop"],
    checkRunName: "[Desktop] Build the app",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
      };
    },
  },
  "test-desktop.yml": {
    affected: ["ledger-live-desktop"],
    checkRunName: "[Desktop] Run e2e and unit tests",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
      };
    },
  },
  "build-mobile.yml": {
    affected: ["live-mobile"],
    checkRunName: "[Mobile] Build the app",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
      };
    },
  },
  "test-mobile.yml": {
    affected: ["live-mobile"],
    checkRunName: "[Mobile] Run tests",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
      };
    },
  },
  "test.yml": {
    affected: [
      "@ledgerhq/live-common",
      "@ledgerhq/cryptoassets",
      "@ledgerhq/devices",
      "@ledgerhq/errors",
      "@ledgerhq/hw-app-algorand",
      "@ledgerhq/hw-app-btc",
      "@ledgerhq/hw-app-cosmos",
      "@ledgerhq/hw-app-eth",
      "@ledgerhq/hw-app-helium",
      "@ledgerhq/hw-app-polkadot",
      "@ledgerhq/hw-app-solana",
      "@ledgerhq/hw-app-str",
      "@ledgerhq/hw-app-tezos",
      "@ledgerhq/hw-app-trx",
      "@ledgerhq/hw-app-xrp",
      "@ledgerhq/hw-transport",
      "@ledgerhq/hw-transport-http",
      "@ledgerhq/hw-transport-mocker",
      "@ledgerhq/hw-transport-node-ble",
      "@ledgerhq/hw-transport-node-hid",
      "@ledgerhq/hw-transport-node-hid-noevents",
      "@ledgerhq/hw-transport-node-hid-singleton",
      "@ledgerhq/hw-transport-node-speculos",
      "@ledgerhq/hw-transport-node-speculos-http",
      "@ledgerhq/hw-transport-web-ble",
      "@ledgerhq/hw-transport-webhid",
      "@ledgerhq/hw-transport-webusb",
      "@ledgerhq/logs",
      "@ledgerhq/react-native-hid",
      "@ledgerhq/react-native-hw-transport-ble",
      "@ledgerhq/types-cryptoassets",
      "@ledgerhq/types-devices",
      "@ledgerhq/types-live",
      "@ledgerhq/crypto-icons-ui",
      "@ledgerhq/icons-ui",
      "@ledgerhq/native-ui",
      "@ledgerhq/react-ui",
      "@ledgerhq/ui-shared",
    ],
    checkRunName: "[Libraries] Run tests",
    getInputs: (payload: any) => {
      return {
        sha: payload.workflow_run.head_sha,
        ref: payload.workflow_run.head_branch,
        since_branch:
          payload.workflow_run.pull_requests[0]?.base.ref || "develop",
      };
    },
  },
};

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

    // @ts-expect-error Expected because probot does not declare this webhook event even though it exists.
    if (context.payload.action !== "in_progress") return;

    /* ⚠️ TEMP */
    if (payload.workflow_run.head_branch !== "support/granular-ci") return;
    /* ⚠️ /TEMP */

    const { owner, repo } = context.repo();
    const workflowFile = extractWorkflowFile(payload);
    const matchedWorkflow = WORKFLOWS[workflowFile as keyof typeof WORKFLOWS];

    if (matchedWorkflow) {
      // Create or retrigger the related check run
      await createOrRerequestRunByName({
        octokit,
        owner,
        repo,
        sha: payload.workflow_run.head_sha,
        checkName: matchedWorkflow.checkRunName,
        updateToPendingFields: {
          details_url: `https://github.com/${owner}/${repo}/actions/runs/${payload.workflow_run.id}`,
          output: {
            title: "⚙️",
            summary: "Work in progress 🧪",
            started_at: new Date().toISOString(),
          }, // TODO: add proper output
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
        output: {
          title: "✅",
          summary: "Completed successfully 🎉",
        }, // TODO: add proper output
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
      // Create or retrigger the related check run
      await createOrRerequestRunByName({
        octokit,
        owner,
        repo,
        sha: payload.check_run.head_sha,
        checkName: GATE_CHECK_RUN_NAME,
        updateToPendingFields: {
          started_at: new Date().toISOString(),
          output: {
            title: "⚙️",
            summary: "Work in progress 🧪",
          }, // TODO: add proper output
        },
      });
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
      const checkSuites = await octokit.checks.listSuitesForRef({
        owner,
        repo,
        ref: payload.check_run.head_sha,
      });
      const checkSuite = checkSuites.data.check_suites.find(
        (suite) => suite.app?.id === BOT_APP_ID
      );
      if (checkSuite) {
        const rawCheckRuns = await octokit.checks.listForSuite({
          owner,
          repo,
          check_suite_id: checkSuite.id,
        });

        const conclusions = [
          "success",
          "pending",
          "waiting",
          "neutral",
          "stale",
          "skipped",
          "timed_out",
          "action_required",
          "cancelled",
          "startup_failure",
          "failure",
        ];
        let gateId = null;

        let summary = `Related check runs:`;

        const [
          aggregatedConclusion,
          aggregatedStatus,
        ] = rawCheckRuns.data.check_runs.reduce(
          (acc, check_run) => {
            if (check_run.name === GATE_CHECK_RUN_NAME) {
              gateId = check_run.id;
              return acc;
            }

            if (
              Object.values(WORKFLOWS).every(
                (w) => w.checkRunName !== check_run.name
              )
            ) {
              return acc;
            }

            summary += `\n- **${check_run.name}**: (${check_run.conclusion ||
              check_run.status})`;

            const priority = conclusions.indexOf(
              check_run.conclusion || "neutral"
            );
            const accumulatorPriority = conclusions.indexOf(acc[0]);
            const newPriority =
              priority > accumulatorPriority
                ? check_run.conclusion || "neutral"
                : acc[0];
            const newStatus =
              check_run.status === "completed" && acc[1] === "completed"
                ? "completed"
                : "in_progress";
            return [newPriority, newStatus];
          },
          ["success", "completed"]
        );

        if (gateId) {
          if (aggregatedStatus === "completed") {
            await octokit.checks.update({
              name: owner,
              repo,
              check_run_id: gateId,
              status: "completed",
              conclusion: aggregatedConclusion,
              output: {
                title: aggregatedConclusion === "success" ? "✅" : "❌",
                summary,
              }, // TODO: add proper output
              completed_at: new Date().toISOString(),
            });
          } else {
            await octokit.checks.update({
              owner,
              repo,
              check_run_id: gateId,
              status: aggregatedStatus,
              output: {
                title: "⚙️",
                summary,
              },
            });
          }
        }
      }
    }
  });
}
