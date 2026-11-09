import React from "react";
import { BackHandler } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PredictionsBindingJobState } from "@features/platform-predictions";
import { PredictionsBindingIntentComponentLWM } from "../componentLWM";

const signingStep = (isAwaitingConfirmation: boolean): PredictionsBindingJobState => ({
  type: "signing",
  deviceModelId: DeviceModelId.FLEX,
  deviceName: "Lily's Flex",
  isAwaitingConfirmation,
});

const isBackConsumed = (addBackListener: jest.SpyInstance) =>
  addBackListener.mock.calls.some(
    ([event, onBackPress]) => event === "hardwareBackPress" && onBackPress() === true,
  );

function renderStep(jobState: PredictionsBindingJobState, onClose = jest.fn()) {
  const view = render(
    <PredictionsBindingIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );
  return { ...view, onClose };
}

describe("PredictionsBindingIntentComponentLWM", () => {
  it("asks to confirm account ownership on the device while signing", () => {
    renderStep(signingStep(true));

    expect(screen.getByText("Confirm account ownership on your Ledger Flex")).toBeOnTheScreen();
    expect(
      screen.getByText("Follow the instructions displayed on your Secure Screen"),
    ).toBeOnTheScreen();
    expect(screen.getByText("Lily's Flex")).toBeOnTheScreen();
  });

  it("keeps the Android back from leaving while the device waits for the signature", () => {
    const addBackListener = jest.spyOn(BackHandler, "addEventListener");

    renderStep(signingStep(true));

    expect(isBackConsumed(addBackListener)).toBe(true);
    addBackListener.mockRestore();
  });

  it("shows the device preparing the signature, and lets the user leave meanwhile", () => {
    const addBackListener = jest.spyOn(BackHandler, "addEventListener");

    renderStep(signingStep(false));

    expect(screen.getByText("Preparing the signature")).toBeOnTheScreen();
    expect(isBackConsumed(addBackListener)).toBe(false);
    addBackListener.mockRestore();
  });

  it("shows a refusal on the device as such, with a close and a retry", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderStep({
      type: "error",
      error: new UserRefusedOnDevice(),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeOnTheScreen();
    await user.press(screen.getByTestId("predictions-binding-retry"));
    await user.press(screen.getByTestId("predictions-binding-close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows another device error with a retry and a close", async () => {
    const retry = jest.fn();
    const blindSigningDisabled = Object.assign(new Error("Enable blind signing"), {
      name: "EthAppPleaseEnableContractData",
    });
    const { user } = renderStep({ type: "error", error: blindSigningDisabled, retry });

    expect(screen.getByTestId("predictions-binding-error")).toBeOnTheScreen();
    await user.press(screen.getByTestId("predictions-binding-retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("says a signature from another key can't be used", () => {
    renderStep({ type: "mismatch" });

    expect(screen.getByText("This signature doesn't match the account")).toBeOnTheScreen();
  });
});
