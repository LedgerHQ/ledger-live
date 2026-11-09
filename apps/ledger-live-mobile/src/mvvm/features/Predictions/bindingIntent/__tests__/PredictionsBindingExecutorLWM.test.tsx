import React from "react";
import { render, waitFor } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { buildDeviceInitializationInput } from "LLM/components/DeviceIntentExecutor";
import { PredictionsBindingExecutorLWM } from "../PredictionsBindingExecutorLWM";

// The integration tests run the real executor; these cover what happens before it shows.
jest.mock("LLM/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: () => null,
}));

const account = genAccount("predictions-binding");

function callbacks() {
  return {
    onSuccess: jest.fn(),
    onError: jest.fn(),
    onCancel: jest.fn(),
    onDone: jest.fn(),
    onDismissed: jest.fn(),
  };
}

describe("PredictionsBindingExecutorLWM", () => {
  it("fails when the device context can't be prepared", async () => {
    const failure = new Error("no app for this currency");
    jest.mocked(buildDeviceInitializationInput).mockRejectedValueOnce(failure);
    const props = callbacks();

    render(<PredictionsBindingExecutorLWM account={account} isOpen {...props} />);

    await waitFor(() => expect(props.onError).toHaveBeenCalledWith(failure));
    // No sheet showed, so none animates out.
    expect(props.onDismissed).toHaveBeenCalledTimes(1);
  });

  it("goes away at once when closed before the device context is ready", () => {
    jest.mocked(buildDeviceInitializationInput).mockReturnValueOnce(new Promise(() => undefined));
    const props = callbacks();
    const view = render(<PredictionsBindingExecutorLWM account={account} isOpen {...props} />);

    view.rerender(<PredictionsBindingExecutorLWM account={account} isOpen={false} {...props} />);

    expect(props.onDismissed).toHaveBeenCalledTimes(1);
  });
});
