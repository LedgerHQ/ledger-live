import { Context, ProbotOctokit } from "probot";

type WorkflowRunPayload = Context<"workflow_run">["payload"];
type CheckRunPayload = Context<"check_run">["payload"];
type GetInputsPayload = WorkflowRunPayload | CheckRunPayload;
type Octokit = InstanceType<typeof ProbotOctokit>;
export type CheckSuite = Awaited<
  ReturnType<Octokit["checks"]["getSuite"]>
>["data"];

export const BOT_APP_ID = 198164;
export const GATE_CHECK_RUN_NAME = "@@PR • Watcher 🪬";
export enum RUNNERS {
  internal,
  external,
  both,
}
export const WORKFLOWS = {
  "build-desktop.yml": {
    checkRunName: "@Desktop • Build App",
    description:
      "Build the Ledger Live Desktop application on all platforms and attach the binaries to the workflow run.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "build-desktop-external.yml": {
    checkRunName: "@Desktop • Build App (external)",
    description:
      "Build the Ledger Live Desktop application on all platforms and attach the binaries to the workflow run.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "test-desktop.yml": {
    checkRunName: "@Desktop • Test App",
    description:
      "Perform [end to end](https://playwright.dev/) and [unit](https://jestjs.io/fr/) tests, [type checks](https://www.typescriptlang.org/) and run the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "test-desktop-external.yml": {
    checkRunName: "@Desktop • Test App (external)",
    description:
      "Run end to end tests ([playwright](https://playwright.dev/), unit tests ([jest](https://jestjs.io/fr/)), the [type checker](https://www.typescriptlang.org/) and the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "build-mobile.yml": {
    checkRunName: "@Mobile • Build App",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.internal,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "build-mobile-external.yml": {
    checkRunName: "@Mobile • Build App (external)",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.external,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  "test-mobile.yml": {
    checkRunName: "@Mobile • Test App",
    description:
      "Perform [type](https://www.typescriptlang.org/) and [lint](https://eslint.org/) checks on the Ledger Live Mobile application.",
    runsOn: RUNNERS.both,
    required: true,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            base_ref:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
  // "test-mobile-e2e.yml": {
  //   checkRunName: "@Mobile • Test App End-2-End",
  //   description: "Run Detox end-to-end tests on Ledger Live Mobile",
  //   runsOn: RUNNERS.internal,
  //   required: false,
  //   affected: ["live-mobile"],
  //   summaryFile: "summary.json",
  //   getInputs: (payload: GetInputsPayload) => {
  //     return "workflow_run" in payload
  //       ? {
  //           login: payload.workflow_run.actor.login,
  //           ref: payload.workflow_run.pull_requests[0]?.head.ref,
  //           base_ref:
  //             payload.workflow_run.pull_requests[0]?.base.ref || "develop",
  //         }
  //       : {
  //           login: payload.sender.login,
  //           ref: payload.check_run.pull_requests[0]?.head.ref,
  //           base_ref: payload.check_run.pull_requests[0]?.base.ref || "develop",
  //         };
  //   },
  // },
  "test.yml": {
    checkRunName: "@Libraries • Tests",
    description: "Run the `test` script for affected libraries.",
    runsOn: RUNNERS.both,
    required: true,
    affected: [/^libs\/.*/],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            ref: payload.workflow_run.pull_requests[0]?.head.ref,
            since_branch:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
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
