import { FlowName } from "@ledgerhq/live-common/device-action/utils";
import React from "react";
import { EMPTY } from "rxjs";
import { render, waitFor } from "tests/testSetup";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { createIntent } from "@features/platform-device-intent";
import type { AccountCompletionIntent, AccountDiscoveryIntent } from "@devtools/bindings";
import type { InitializationInput } from "LLD/components/DeviceIntentExecutor";
import {
  buildDeviceInitializationInput,
  DeviceIntentExecutor,
} from "LLD/components/DeviceIntentExecutor";
import { accountCompletionIntentLWDDefinition } from "./accountCompletionIntentLWDDefinition";
import { accountDiscoveryIntentLWDDefinition } from "./accountDiscoveryIntentLWDDefinition";
import { AccountDiscoveryExecutor } from "./AccountDiscoveryExecutor";

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: jest.fn(() => null),
}));

const INITIALIZATION_INPUT = { appName: "Bitcoin" } as unknown as InitializationInput;

const input: AccountDiscoveryIntent["input"] = { startScan: () => EMPTY };

const completionInput: AccountCompletionIntent["input"] = { startScan: () => EMPTY };

const run = {
  kind: "scan" as const,
  currencyId: CryptoCurrencyIdSchema.parse("bitcoin"),
  intent: createIntent(accountDiscoveryIntentLWDDefinition, input),
};

describe("AccountDiscoveryExecutor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(buildDeviceInitializationInput).mockResolvedValue(INITIALIZATION_INPUT);
  });

  it("mounts no executor while no scan runs", () => {
    render(<AccountDiscoveryExecutor run={null} onUserCancel={jest.fn()} onError={jest.fn()} />);
    expect(buildDeviceInitializationInput).not.toHaveBeenCalled();
    expect(DeviceIntentExecutor).not.toHaveBeenCalled();
  });

  it("runs the scan's intent on the currency's app", async () => {
    const onUserCancel = jest.fn();
    render(<AccountDiscoveryExecutor run={run} onUserCancel={onUserCancel} onError={jest.fn()} />);
    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(buildDeviceInitializationInput).toHaveBeenCalledWith({
      appRequest: { appName: "Bitcoin" },
      flow: FlowName.addAccount,
      currencyName: "Bitcoin",
    });
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      sourceFlow: "debug",
      deviceInitializationInput: INITIALIZATION_INPUT,
      intent: run.intent,
      onUserCancel,
    });
  });

  it("runs a completion on the same currency's app", async () => {
    const completion = {
      kind: "complete" as const,
      currencyId: run.currencyId,
      intent: createIntent(accountCompletionIntentLWDDefinition, completionInput),
    };
    render(
      <AccountDiscoveryExecutor run={completion} onUserCancel={jest.fn()} onError={jest.fn()} />,
    );
    await waitFor(() => expect(DeviceIntentExecutor).toHaveBeenCalled());
    expect(jest.mocked(DeviceIntentExecutor).mock.calls.at(-1)?.[0]).toMatchObject({
      intent: completion.intent,
    });
  });

  it("reports a failure to open the app as an error, not a cancel", async () => {
    const failure = new Error("no app");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValue(failure);
    const onUserCancel = jest.fn();
    const onError = jest.fn();
    render(<AccountDiscoveryExecutor run={run} onUserCancel={onUserCancel} onError={onError} />);
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    expect(onUserCancel).not.toHaveBeenCalled();
  });
});
