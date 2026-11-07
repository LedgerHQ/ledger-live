import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { SignAccountTransactionIntentJobState } from "@features/platform-sign-account-transaction-intent";
import { SignOnDeviceComponentLWD } from "./SignOnDeviceComponentLWD";

function renderComponent(jobState: SignAccountTransactionIntentJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <SignOnDeviceComponentLWD jobState={jobState} extraProps={undefined} onClose={onClose} />,
  );
  return { user, onClose };
}

describe("SignOnDeviceComponentLWD", () => {
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending", deviceModelId: DeviceModelId.STAX } as const],
  ])("should show the pending screen when the job state is %s", (_, jobState) => {
    renderComponent(jobState);
    expect(screen.getByTestId("wallet-api-account-data-sign-pending")).toBeVisible();
  });

  it("should ask the user to continue on the device it reports", () => {
    renderComponent({
      type: "device-signature-requested",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Lily's Stax",
    });
    expect(screen.getByText("Continue on your Ledger Stax")).toBeVisible();
    expect(screen.getByText("Lily's Stax")).toBeVisible();
  });

  it("should let the user retry or close after a refusal on the device", async () => {
    const retry = jest.fn();
    const { user, onClose } = renderComponent({ type: "cancelled", retry });

    expect(screen.getByText("Operation rejected on Ledger device")).toBeVisible();
    await user.click(screen.getByTestId("wallet-api-account-data-sign-retry"));
    await user.click(screen.getByTestId("wallet-api-account-data-sign-close"));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
