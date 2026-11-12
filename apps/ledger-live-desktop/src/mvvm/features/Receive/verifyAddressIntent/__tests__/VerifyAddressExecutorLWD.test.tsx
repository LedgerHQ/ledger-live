import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { buildDeviceInitializationInput } from "LLD/components/DeviceIntentExecutor";
import { VerifyAddressExecutorLWD } from "../VerifyAddressExecutorLWD";
import { track } from "@shared/analytics";
import { VERIFY_SELECTION } from "./verifySelection.fixture";

let onJobStateChanged: (state: { type: string }) => void;
let onUserCancel: () => void;

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

jest.mock("LLD/components/DeviceIntentExecutor", () => ({
  buildDeviceInitializationInput: jest.fn(),
  DeviceIntentExecutor: (props: {
    onIntentJobStateChanged: typeof onJobStateChanged;
    onUserCancel: typeof onUserCancel;
  }) => {
    onJobStateChanged = props.onIntentJobStateChanged;
    onUserCancel = props.onUserCancel;
    return <div data-testid="device-intent-executor" />;
  },
}));

const buildInit = jest.mocked(buildDeviceInitializationInput);

function renderExecutor(onReady = jest.fn(), onExit = jest.fn()) {
  render(
    <VerifyAddressExecutorLWD selection={VERIFY_SELECTION} onReady={onReady} onExit={onExit} />,
  );
  return { onReady, onExit };
}

describe("VerifyAddressExecutorLWD", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildInit.mockResolvedValue({} as never);
  });

  it("should keep the success screen up once confirmed and exit verified when it closes", async () => {
    const { onReady, onExit } = renderExecutor();

    await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());
    expect(onReady).toHaveBeenCalledTimes(1);

    act(() => onJobStateChanged({ type: "verified" }));

    expect(track).toHaveBeenCalledWith(
      "receive_verification_complete",
      expect.objectContaining({ flow: "receive", page: "Receive Address Verification" }),
    );
    expect(onExit).not.toHaveBeenCalled();

    act(() => onUserCancel());

    expect(onExit).toHaveBeenCalledWith("verified");
    expect(track).not.toHaveBeenCalledWith("receive_verification_dismiss", expect.anything());
  });

  it("should track a dismissal when the user leaves before confirming", async () => {
    const { onExit } = renderExecutor();
    await waitFor(() => expect(screen.getByTestId("device-intent-executor")).toBeVisible());

    act(() => onUserCancel());

    expect(track).toHaveBeenCalledWith("receive_verification_dismiss", expect.anything());
    expect(onExit).toHaveBeenCalledWith("dismissed");
  });

  it("should call onExit with initFailed when device initialization fails", async () => {
    buildInit.mockRejectedValueOnce(new Error("fail"));
    const { onExit } = renderExecutor();

    await waitFor(() => expect(onExit).toHaveBeenCalledWith("initFailed"));
  });
});
