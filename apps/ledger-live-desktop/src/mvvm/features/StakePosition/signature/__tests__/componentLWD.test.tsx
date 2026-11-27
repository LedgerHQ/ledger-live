import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import type { SignedOperation } from "@ledgerhq/types-live";
import { StakePositionSignatureComponentLWD } from "../componentLWD";

const COPY = {
  continueOnDevice: "Continue on your Ledger Flex",
  secureScreen: "Follow the instructions displayed on your Secure Screen.",
  processing: "This can take a few minutes.",
  deactivating: "Deactivate transaction in progress",
  withdrawing: "Withdraw transaction in progress",
  refused: "Operation rejected on Ledger device",
  retry: "Retry",
  close: "Close",
} as const;

function renderComponent(
  jobState: SignTransactionIntentWithResultJobState | undefined,
  { deviceName = "Lily's Ledger", action = "deactivate" as StakePositionExitAction } = {},
) {
  const onClose = jest.fn();
  const view = render(
    <StakePositionSignatureComponentLWD
      jobState={jobState}
      extraProps={{ deviceName, action }}
      onClose={onClose}
    />,
  );
  return { ...view, onClose };
}

describe("StakePositionSignatureComponentLWD", () => {
  it.each([
    ["pending", { type: "pending", deviceModelId: DeviceModelId.europa } as const],
    [
      "device-signature-requested",
      { type: "device-signature-requested", deviceModelId: DeviceModelId.europa } as const,
    ],
  ])("should ask the user to follow the Secure Screen when the job is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.continueOnDevice)).toBeVisible();
    expect(screen.getByText(COPY.secureScreen)).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
  });

  it("should name no device before the executor knows it", () => {
    renderComponent({ type: "pending", deviceModelId: DeviceModelId.europa }, { deviceName: "" });

    expect(screen.getByText(COPY.continueOnDevice)).toBeVisible();
    expect(screen.queryByText("Lily's Ledger")).not.toBeInTheDocument();
  });

  it.each([
    ["device-streaming", { type: "device-streaming", progress: 0.5 } as const],
    [
      "device-signature-granted",
      { type: "device-signature-granted", deviceModelId: DeviceModelId.europa } as const,
    ],
    ["signed", { type: "signed", signedOperation: {} as SignedOperation } as const],
  ])("should say the deactivation is being processed when the job is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.deactivating)).toBeVisible();
    expect(screen.getByText(COPY.processing)).toBeVisible();
  });

  it("should say the withdrawal is being processed", () => {
    renderComponent({ type: "device-streaming", progress: 0.5 }, { action: "withdraw" });

    expect(screen.getByText(COPY.withdrawing)).toBeVisible();
    expect(screen.queryByText(COPY.deactivating)).not.toBeInTheDocument();
  });

  it("should show nothing before the job starts", () => {
    renderComponent(undefined);

    expect(screen.queryByText(COPY.continueOnDevice)).not.toBeInTheDocument();
    expect(screen.queryByText(COPY.processing)).not.toBeInTheDocument();
  });

  describe("when the user refuses on the device", () => {
    it("should retry the signature on the device", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "cancelled", retry });

      expect(screen.getByText(COPY.refused)).toBeVisible();
      await user.click(screen.getByRole("button", { name: COPY.retry }));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should close the device step", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "cancelled", retry });

      await user.click(screen.getByRole("button", { name: COPY.close }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });
  });

  describe("when the signature fails", () => {
    const error = Object.assign(new Error("The device answered an error"), {
      name: "TransportStatusError",
    });

    it("should explain the error and retry the signature", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "error", error, retry });

      expect(screen.getByTestId("stake-position-signature-error")).toBeVisible();
      expect(screen.getByText("Something went wrong. Please reconnect your device")).toBeVisible();
      await user.click(screen.getByTestId("stake-position-signature-error-retry"));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should close the device step", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "error", error, retry });

      await user.click(screen.getByTestId("stake-position-signature-error-close"));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });
  });
});
