import React from "react";
import { render, waitFor } from "tests/testSetup";
import type { IntentWalletSyncRun } from "@devtools/bindings";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import {
  buildAddMemberIntent,
  buildRemoveMemberIntent,
  INITIALIZATION_INPUT,
} from "../../WalletSync/deviceIntents/__tests__/ledgerSyncIntentTestKit";
import { IntentWalletSyncExecutor } from "./IntentWalletSyncExecutor";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const runs: IntentWalletSyncRun[] = [
  { operation: "add-member", intent: buildAddMemberIntent() },
  { operation: "remove-member", intent: buildRemoveMemberIntent() },
];

describe("IntentWalletSyncExecutor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT);
  });

  it("should mount no executor while the devtool is idle", () => {
    render(<IntentWalletSyncExecutor run={null} onUserCancel={jest.fn()} />);

    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });

  it.each(runs)("should mount the app executor for $operation", async run => {
    const onUserCancel = jest.fn();

    render(<IntentWalletSyncExecutor run={run} onUserCancel={onUserCancel} />);

    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      sourceFlow: "ledger_sync",
      intent: run.intent,
      onUserCancel,
    });
  });
});
