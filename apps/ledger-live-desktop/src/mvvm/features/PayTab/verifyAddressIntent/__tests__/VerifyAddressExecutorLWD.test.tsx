import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { VerifyAddressExecutorLWD } from "../VerifyAddressExecutorLWD";

let onJobStateChanged: (state: { type: string }) => void;

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutorLWD: (props: { onIntentJobStateChanged: typeof onJobStateChanged }) => {
    onJobStateChanged = props.onIntentJobStateChanged;
    return <div data-testid="device-intent-executor" />;
  },
}));

const buildInit = jest.mocked(buildDeviceInitializationInput);
const account = genAccount("pay-verify-address-executor");

function renderExecutor(onReady = jest.fn(), onExit = jest.fn()) {
  render(<VerifyAddressExecutorLWD selection={{ account }} onReady={onReady} onExit={onExit} />);
  return { onReady, onExit };
}

describe("VerifyAddressExecutorLWD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildInit.mockResolvedValue({} as never);
  });

  it("should call onReady then onExit(verified) once the address is confirmed", async () => {
    const { onReady, onExit } = renderExecutor();

    await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
    expect(onReady).toHaveBeenCalledTimes(1);

    act(() => onJobStateChanged({ type: "verified" }));

    expect(onExit).toHaveBeenCalledWith("verified");
  });

  it("should call onExit with initFailed when device initialization fails", async () => {
    buildInit.mockRejectedValueOnce(new Error("fail"));
    const { onExit } = renderExecutor();

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("initFailed"));
  });
});
