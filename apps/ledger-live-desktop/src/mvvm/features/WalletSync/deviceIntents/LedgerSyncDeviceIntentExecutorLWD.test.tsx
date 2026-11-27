import React from "react";
import { render, waitFor } from "tests/testSetup";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import { getKeyRingDeviceInitialization } from "@features/platform-key-ring";
import { buildAddMemberIntent, INITIALIZATION_INPUT } from "./__tests__/ledgerSyncIntentTestKit";
import { LedgerSyncDeviceIntentExecutorLWD } from "./LedgerSyncDeviceIntentExecutorLWD";

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  getKeyRingDeviceInitialization: jest.fn(
    jest.requireActual("@features/platform-key-ring").getKeyRingDeviceInitialization,
  ),
}));

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
      kind: "app",
      appRequest: { appName: "Ledger Sync" },
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

  it("should fail the intent as device-unsupported on an OS feature requirement", () => {
    jest
      .mocked(getKeyRingDeviceInitialization)
      .mockReturnValueOnce({ kind: "os-feature", feature: "lkrp", minimumOsVersion: "2.0.0" });
    const onJobStateChanged = jest.fn();

    render(
      <LedgerSyncDeviceIntentExecutorLWD
        intent={{ ...intent, onJobStateChanged }}
        onUserCancel={jest.fn()}
      />,
    );

    expect(onJobStateChanged).toHaveBeenCalledWith(
      expect.objectContaining({ type: "failed", reason: "device-unsupported" }),
    );
    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });
});
