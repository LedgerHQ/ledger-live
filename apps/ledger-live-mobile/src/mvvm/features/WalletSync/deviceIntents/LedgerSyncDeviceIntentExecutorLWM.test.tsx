import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-ledger-key-ring-protocol";
import { createIntent } from "@features/platform-device-intent";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLM/components/DeviceIntentExecutor";
import { addMemberIntentLWMDefinition } from "./addMemberIntent/intentLWMDefinition";
import { LedgerSyncDeviceIntentExecutorLWM } from "./LedgerSyncDeviceIntentExecutorLWM";

const INITIALIZATION_INPUT = { appName: TRUSTCHAIN_APP_NAME, dependencies: [] };

jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const intent = createIntent(addMemberIntentLWMDefinition, {
  memberCredentials: { pubkey: "pubkey", privatekey: "privatekey" },
  createSessionSdk: jest.fn(),
});

describe("LedgerSyncDeviceIntentExecutorLWM", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should run the intent in the Ledger Sync app under the ledger_sync source flow", async () => {
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT as never);

    render(<LedgerSyncDeviceIntentExecutorLWM intent={intent} onUserCancel={jest.fn()} />);

    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { appName: TRUSTCHAIN_APP_NAME },
    });
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      enabled: true,
      sourceFlow: "ledger_sync",
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
});
