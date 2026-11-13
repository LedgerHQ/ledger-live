import React from "react";
import { render, waitFor } from "tests/testSetup";
import { createIntent } from "@features/platform-device-intent";
import type { AccountDiscoveryIntentInput } from "@features/platform-account-discovery-intent";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import { accountDiscoveryIntentLWDDefinition } from "./accountDiscoveryIntentLWDDefinition";
import { AccountDiscoveryExecutor } from "./AccountDiscoveryExecutor";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const INITIALIZATION_INPUT = { appName: "Bitcoin" } as unknown as InitializationInput;

const input: AccountDiscoveryIntentInput = {
  options: { currencyId: "bitcoin" },
  createDerive: () => async () => null,
  readStatus: async () => ({ used: false, gate: null }),
};

const run = {
  currencyId: "bitcoin",
  intent: createIntent(accountDiscoveryIntentLWDDefinition, input),
};

describe("AccountDiscoveryExecutor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT);
  });

  it("mounts no executor while no scan runs", () => {
    render(<AccountDiscoveryExecutor run={null} onUserCancel={jest.fn()} />);
    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });

  it("runs the scan's intent on the currency's app", async () => {
    const onUserCancel = jest.fn();
    render(<AccountDiscoveryExecutor run={run} onUserCancel={onUserCancel} />);
    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { appName: "Bitcoin" },
    });
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      sourceFlow: "debug",
      deviceInitializationInput: INITIALIZATION_INPUT,
      intent: run.intent,
      onUserCancel,
    });
  });
});
