import React from "react";
import { BackHandler } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import type { StakePositionExitAction } from "@features/flow-stake-position";
import { isModalLockedSelector } from "~/reducers/appstate";
import { StakePositionSignatureComponentLWM } from "../componentLWM";

const COPY = {
  continueOnDevice: "Continue on your Ledger Flex",
  secureScreen: /Follow the instructions displayed on your Secure.Screen/,
  processing: "This can take a few minutes.",
  deactivating: "Deactivate transaction in progress",
  withdrawing: "Withdraw transaction in progress",
  refused: "Operation rejected on Ledger device",
  lockedTitle: "Your device is locked",
  lockedDescription: "Unlock your device and try again.",
  retry: "Retry",
  close: "Close",
} as const;

function renderComponent(
  jobState: SignTransactionIntentWithResultJobState | undefined,
  { deviceName = "Lily's Ledger", action = "deactivate" as StakePositionExitAction } = {},
) {
  const onClose = jest.fn();
  const view = render(
    <StakePositionSignatureComponentLWM
      jobState={jobState}
      extraProps={{ deviceName, action }}
      onClose={onClose}
    />,
  );
  return { ...view, onClose };
}

const isBackConsumed = (addBackListener: jest.SpyInstance) =>
  addBackListener.mock.calls.some(
    ([event, onBackPress]) => event === "hardwareBackPress" && onBackPress() === true,
  );

describe("StakePositionSignatureComponentLWM", () => {
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
    expect(screen.queryByText("Lily's Ledger")).toBeNull();
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
    expect(screen.queryByText(COPY.deactivating)).toBeNull();
  });

  it.each([
    ["waits for the device", { type: "pending", deviceModelId: DeviceModelId.europa } as const],
    ["is processed", { type: "signed", signedOperation: {} as SignedOperation } as const],
  ])("should lock the sheets and the Android back while the transaction %s", (_, jobState) => {
    const addBackListener = jest.spyOn(BackHandler, "addEventListener");

    const { store } = renderComponent(jobState);

    expect(isModalLockedSelector(store.getState())).toBe(true);
    expect(isBackConsumed(addBackListener)).toBe(true);
    addBackListener.mockRestore();
  });

  it("should show nothing, and lock nothing, before the job starts", () => {
    const { store } = renderComponent(undefined);

    expect(screen.queryByText(COPY.continueOnDevice)).toBeNull();
    expect(screen.queryByText(COPY.processing)).toBeNull();
    expect(isModalLockedSelector(store.getState())).toBe(false);
  });

  describe("when the user refuses on the device", () => {
    it("should show the refusal, lock nothing and retry the signature on the device", async () => {
      const retry = jest.fn();
      const { store, user, onClose } = renderComponent({ type: "cancelled", retry });

      expect(screen.getByText(COPY.refused)).toBeVisible();
      expect(screen.queryByText(COPY.processing)).toBeNull();
      expect(isModalLockedSelector(store.getState())).toBe(false);
      await user.press(screen.getByRole("button", { name: COPY.retry }));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should close the device step", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "cancelled", retry });

      await user.press(screen.getByRole("button", { name: COPY.close }));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });
  });

  describe("when the signature fails", () => {
    const error = Object.assign(new Error("The device is locked"), { name: "LockedDeviceError" });

    it("should explain the error, lock nothing and retry the signature on the device", async () => {
      const retry = jest.fn();
      const { store, user, onClose } = renderComponent({ type: "error", error, retry });

      expect(screen.getByTestId("stake-position-signature-error")).toBeVisible();
      expect(screen.getByText(COPY.lockedTitle)).toBeVisible();
      expect(screen.getByText(COPY.lockedDescription)).toBeVisible();
      expect(isModalLockedSelector(store.getState())).toBe(false);
      await user.press(screen.getByTestId("stake-position-signature-error-retry"));

      expect(retry).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it("should close the device step", async () => {
      const retry = jest.fn();
      const { user, onClose } = renderComponent({ type: "error", error, retry });

      await user.press(screen.getByTestId("stake-position-signature-error-close"));

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(retry).not.toHaveBeenCalled();
    });

    it("should name an error the app has no wording for by its message", () => {
      renderComponent({
        type: "error",
        error: new Error("Something odd happened"),
        retry: jest.fn(),
      });

      expect(screen.getByText("Something odd happened")).toBeVisible();
    });
  });
});
