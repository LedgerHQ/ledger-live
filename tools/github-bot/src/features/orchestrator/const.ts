import { Context } from "probot";

type WorkflowRunPayload = Context<"workflow_run">["payload"];
type CheckRunPayload = Context<"check_run">["payload"];
type GetInputsPayload = WorkflowRunPayload | CheckRunPayload;

export const BOT_APP_ID = 198164;
export const GATE_CHECK_RUN_NAME = "The Balrog has been summoned ❤️‍🔥";
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
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "build-desktop-external.yml": {
    checkRunName: "@Desktop • Build App (external)",
    description:
      "Build the Ledger Live Desktop application on all platforms and attach the binaries to the workflow run.",
    runsOn: RUNNERS.external,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "test-desktop.yml": {
    checkRunName: "@Desktop • Test App",
    description:
      "Perform [end to end](https://playwright.dev/) and [unit](https://jestjs.io/fr/) tests, [type checks](https://www.typescriptlang.org/) and run the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.internal,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "test-desktop-external.yml": {
    checkRunName: "@Desktop • Test App (external)",
    description:
      "Run end to end tests ([playwright](https://playwright.dev/), unit tests ([jest](https://jestjs.io/fr/)), the [type checker](https://www.typescriptlang.org/) and the [linter](https://eslint.org/) on the Ledger Live Desktop application.",
    runsOn: RUNNERS.external,
    affected: ["ledger-live-desktop"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "build-mobile.yml": {
    checkRunName: "@Mobile • Build App",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.internal,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "build-mobile-external.yml": {
    checkRunName: "@Mobile • Build App (external)",
    description:
      "Build the Ledger Live Mobile application and attach the apk to the workflow run.",
    runsOn: RUNNERS.external,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "test-mobile.yml": {
    checkRunName: "@Mobile • Test App",
    description:
      "Perform [type](https://www.typescriptlang.org/) and [lint](https://eslint.org/) checks on the Ledger Live Mobile application.",
    runsOn: RUNNERS.both,
    affected: ["live-mobile"],
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
          };
    },
  },
  "test.yml": {
    checkRunName: "@Libraries • Tests",
    description: "Run the `test` script for affected libraries.",
    runsOn: RUNNERS.both,
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
    summaryFile: "summary.json",
    getInputs: (payload: GetInputsPayload) => {
      return "workflow_run" in payload
        ? {
            login: payload.workflow_run.actor.login,
            sha: payload.workflow_run.head_sha,
            ref: payload.workflow_run.head_branch,
            since_branch:
              payload.workflow_run.pull_requests[0]?.base.ref || "develop",
          }
        : {
            login: payload.sender.login,
            sha: payload.check_run.head_sha,
            ref: payload.check_run.pull_requests[0]?.head.ref,
            since_branch:
              payload.check_run.pull_requests[0]?.base.ref || "develop",
          };
    },
  },
};
