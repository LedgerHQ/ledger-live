import { Context, ProbotOctokit } from "probot";

export type WorkflowRunPayload = Context<"workflow_run">["payload"];
export type CheckRunPayload = Context<"check_run">["payload"];
export type GetInputsPayload = WorkflowRunPayload | CheckRunPayload;
export type Octokit = InstanceType<typeof ProbotOctokit>;
export type PullRequestMetadata = {
  number: number;
  head_sha: string;
  head_branch: string;
  base_sha: string;
  base_branch: string;
  base_owner: string;
  is_fork: boolean;
};
export type CheckSuite = Awaited<
  ReturnType<Octokit["checks"]["getSuite"]>
>["data"];

export const SYNC_ACTION = "sync_action";
export const REPO_OWNER = "LedgerHQ";
export const BOT_APP_ID = 198164;
export const WATCHER_CHECK_RUN_NAME = "@@PR • Watcher 🪬";
export const REF_PREFIX = "refs/heads";
export enum RUNNERS {
  internal,
  external,
  both,
}
const commonGetInputs = (
  payload: GetInputsPayload,
  metadata?: PullRequestMetadata,
  localRef?: string
) => {
  return "workflow_run" in payload
    ? {
        login: payload.workflow_run.actor.login,
        ref:
          localRef ??
          metadata?.head_branch ??
          payload.workflow_run.pull_requests[0]?.head.ref,
        base_ref:
          metadata?.base_branch ||
          payload.workflow_run.pull_requests[0]?.base.ref ||
          "develop",
      }
    : {
        login: payload.sender.login,
        ref: payload.check_run.pull_requests[0]?.head.ref,
        base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
      };
};
export const WORKFLOWS = {
  "build-desktop.yml": {
    checkRunName: "@Desktop • Build App",
    description:
      "Build the Ledger Live Desktop application on all platforms and attach the binaries to the workflow run.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "build-desktop-external.yml": {
    checkRunName: "@Desktop • Build App (external)",
    description:
      "Build the Ledger Live Desktop application on all platforms and attach the binaries to the workflow run.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "test-desktop.yml": {
    checkRunName: "@Desktop • Test App",
    description:
      "Perform [end to end](https://playwright.dev/) and [unit](https://jestjs.io/fr/) tests, [type checks](https://www.typescriptlang.org/) and run the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "test-desktop-external.yml": {
    checkRunName: "@Desktop • Test App (external)",
    description:
      "Run end to end tests ([playwright](https://playwright.dev/), unit tests ([jest](https://jestjs.io/fr/)), the [type checker](https://www.typescriptlang.org/) and the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "build-mobile.yml": {
    checkRunName: "@Mobile • Build App",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "build-mobile-external.yml": {
    checkRunName: "@Mobile • Build App (external)",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "test-mobile.yml": {
    checkRunName: "@Mobile • Test App",
    description:
      "Perform [type](https://www.typescriptlang.org/) and [lint](https://eslint.org/) checks on the Ledger Live Mobile application.",
    runsOn: RUNNERS.both,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "test-mobile-e2e.yml": {
    checkRunName: "@Mobile • Test App End-2-End",
    description: "Run Detox end-to-end tests on Ledger Live Mobile",
    runsOn: RUNNERS.internal,
    required: false,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: commonGetInputs,
  },
  "test.yml": {
    checkRunName: "@Libraries • Tests",
    description: "Run the `test` script for affected libraries.",
    runsOn: RUNNERS.both,
    required: true,
    affected: [/^libs\/.*/],
    summaryFile: "summary.json",
    getInputs: (
      payload: GetInputsPayload,
      metadata?: PullRequestMetadata,
      localRef?: string
    ) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref:
              localRef ??
              metadata?.head_branch ??
              payload.workflow_run.pull_requests[0]?.head.ref,
            since_branch:
              metadata?.base_branch ||
              payload.workflow_run.pull_requests[0]?.base.ref ||
              "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            since_branch:
              payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
};
