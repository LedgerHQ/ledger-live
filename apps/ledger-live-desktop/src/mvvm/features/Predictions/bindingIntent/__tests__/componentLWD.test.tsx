import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import type { PredictionsBindingJobState } from "@features/platform-predictions";
import { PredictionsBindingIntentComponentLWD } from "../componentLWD";

function renderStep(jobState: PredictionsBindingJobState, onClose = jest.fn()) {
  const view = render(
    <PredictionsBindingIntentComponentLWD
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );
  return { ...view, onClose };
}

describe("PredictionsBindingIntentComponentLWD", () => {
  it("shows the device preparing the signature, then asks to confirm on it", () => {
    const signing = {
      type: "signing",
      deviceModelId: DeviceModelId.FLEX,
      deviceName: "Lily's Flex",
    } as const;
    const { rerender } = renderStep({ ...signing, isAwaitingConfirmation: false });
    expect(screen.getByText("Preparing the signature")).toBeVisible();

    rerender(
      <PredictionsBindingIntentComponentLWD
        jobState={{ ...signing, isAwaitingConfirmation: true }}
        extraProps={undefined}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Confirm account ownership on your Ledger Flex")).toBeVisible();
    expect(
      screen.getByText("Follow the instructions displayed on your Secure Screen"),
    ).toBeVisible();
    expect(screen.getByText("Lily's Flex")).toBeVisible();
  });

  it("shows a refusal on the device as such, with a close and a retry", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderStep({
      type: "error",
      error: new UserRefusedOnDevice(),
      retry,
    });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    await user.click(screen.getByTestId("predictions-binding-retry"));
    await user.click(screen.getByTestId("predictions-binding-close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows another device error with a retry and a close", async () => {
    const retry = jest.fn();
    const blindSigningDisabled = Object.assign(new Error("Enable blind signing"), {
      name: "EthAppPleaseEnableContractData",
    });
    const { user } = renderStep({ type: "error", error: blindSigningDisabled, retry });

    expect(screen.getByTestId("predictions-binding-error")).toBeVisible();
    await user.click(screen.getByTestId("predictions-binding-retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("says a signature from another key can't be used", () => {
    renderStep({ type: "mismatch" });

    expect(screen.getByText("This signature doesn't match the account")).toBeVisible();
  });
});
