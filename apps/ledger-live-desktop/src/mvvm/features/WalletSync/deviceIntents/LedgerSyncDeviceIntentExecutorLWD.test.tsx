import React from "react";
import { render, waitFor } from "tests/testSetup";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import { buildAddMemberIntent, INITIALIZATION_INPUT } from "./__tests__/ledgerSyncIntentTestKit";
import { LedgerSyncDeviceIntentExecutorLWD } from "./LedgerSyncDeviceIntentExecutorLWD";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const intent = buildAddMemberIntent();

describe("LedgerSyncDeviceIntentExecutorLWD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run the intent in the Ledger Sync app under the ledger_sync source flow", async () => {
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT);

    render(<LedgerSyncDeviceIntentExecutorLWD intent={intent} onUserCancel={jest.fn()} />);

    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { appName: TRUSTCHAIN_APP_NAME },
    });
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      enabled: true,
      sourceFlow: "ledger_sync",
      deviceConnectionParams: { acceptedDeviceModelIds: [] },
      deviceInitializationInput: INITIALIZATION_INPUT,
      intent,
    });
  });

  it("should give the flow back when the initialization input cannot be built", async () => {
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(new Error("no app"));
    const onUserCancel = jest.fn();

    render(<LedgerSyncDeviceIntentExecutorLWD intent={intent} onUserCancel={onUserCancel} />);

    await waitFor(() => expect(onUserCancel).toHaveBeenCalledTimes(1));
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });
});
