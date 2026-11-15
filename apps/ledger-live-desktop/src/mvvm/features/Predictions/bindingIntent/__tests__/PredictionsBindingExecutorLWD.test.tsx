import React from "react";
import { render, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { PredictionsBindingExecutorLWD } from "../PredictionsBindingExecutorLWD";

// The integration tests run the real executor; this covers a failure they can't reach.
jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: () => null,
}));

describe("PredictionsBindingExecutorLWD", () => {
  it("fails when the device context can't be prepared", async () => {
    const failure = new Error("no app for this currency");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
    const props = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
      onCancel: jest.fn(),
      onDone: jest.fn(),
    };

    render(
      <PredictionsBindingExecutorLWD account={genAccount("predictions-binding")} {...props} />,
    );

    await waitFor(() => expect(props.onError).toHaveBeenCalledWith(failure));
    expect(props.onDone).toHaveBeenCalledTimes(1);
  });
});
