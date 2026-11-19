import React from "react";
import { BackHandler } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { isModalLockedSelector } from "~/reducers/appstate";
import { StakePositionSignatureComponentLWM } from "../componentLWM";

const COPY = {
  continueOnDevice: "Continue on your Ledger Flex",
  secureScreen: /Follow the instructions displayed on your Secure.Screen/,
  processing: "This can take a few minutes.",
} as const;

const retry = () => undefined;

function renderComponent(
  jobState: SignTransactionIntentWithResultJobState | undefined,
  deviceName = "Lily's Ledger",
) {
  return render(
    <StakePositionSignatureComponentLWM
      jobState={jobState}
      extraProps={{ deviceName }}
      onClose={jest.fn()}
    />,
  );
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
    renderComponent({ type: "pending", deviceModelId: DeviceModelId.europa }, "");

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
  ])("should say the transaction is being processed when the job is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.processing)).toBeVisible();
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

  it.each([
    ["undefined", undefined],
    ["cancelled", { type: "cancelled", retry } as const],
    ["error", { type: "error", error: new Error("boom"), retry } as const],
  ])(
    "should show nothing, and lock nothing, when the job is %s: the stake position sheet takes over",
    (_, jobState) => {
      const { store } = renderComponent(jobState);

      expect(screen.queryByText(COPY.continueOnDevice)).toBeNull();
      expect(screen.queryByText(COPY.processing)).toBeNull();
      expect(isModalLockedSelector(store.getState())).toBe(false);
    },
  );
});
