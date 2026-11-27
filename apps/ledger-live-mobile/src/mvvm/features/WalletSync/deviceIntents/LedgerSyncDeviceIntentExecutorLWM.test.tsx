import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { getKeyRingDeviceInitialization } from "@features/platform-key-ring";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLM/components/DeviceIntentExecutor";
import { buildAddMemberIntent, INITIALIZATION_INPUT } from "./__tests__/ledgerSyncIntentTestKit";
import { LedgerSyncDeviceIntentExecutorLWM } from "./LedgerSyncDeviceIntentExecutorLWM";

jest.mock("@features/platform-key-ring", () => ({
  ...jest.requireActual("@features/platform-key-ring"),
  getKeyRingDeviceInitialization: jest.fn(
    jest.requireActual("@features/platform-key-ring").getKeyRingDeviceInitialization,
  ),
}));

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const intent = buildAddMemberIntent();

describe("LedgerSyncDeviceIntentExecutorLWM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run the intent in the Ledger Sync app under the ledger_sync source flow", async () => {
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT);

    render(<LedgerSyncDeviceIntentExecutorLWM intent={intent} onUserCancel={jest.fn()} />);

    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith(getKeyRingDeviceInitialization());
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

    render(<LedgerSyncDeviceIntentExecutorLWM intent={intent} onUserCancel={onUserCancel} />);

    await waitFor(() => expect(onUserCancel).toHaveBeenCalledTimes(1));
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });

  it("should fail the intent as device-unsupported on an OS feature requirement", () => {
    jest
      .mocked(getKeyRingDeviceInitialization)
      .mockReturnValueOnce({ kind: "os-feature", feature: "lkrp", minimumOsVersion: "2.0.0" });
    const onJobStateChanged = jest.fn();
    const onIntentJobStateChanged = jest.fn();

    render(
      <LedgerSyncDeviceIntentExecutorLWM
        intent={{ ...intent, onJobStateChanged }}
        onUserCancel={jest.fn()}
        onIntentJobStateChanged={onIntentJobStateChanged}
      />,
    );

    const failure = expect.objectContaining({ type: "failed", reason: "device-unsupported" });
    expect(onJobStateChanged).toHaveBeenCalledWith(failure);
    expect(onIntentJobStateChanged).toHaveBeenCalledWith(failure);
    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });
});
