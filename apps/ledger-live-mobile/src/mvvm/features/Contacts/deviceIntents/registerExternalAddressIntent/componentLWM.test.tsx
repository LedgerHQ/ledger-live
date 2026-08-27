import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { RegisterExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { RegisterExternalAddressComponentLWM } from "./componentLWM";

const COPY = {
  pending: "Preparing your Ledger device",
  continueOnDevice: "Continue on your Ledger Stax",
  rejected: "Operation rejected on Ledger device",
  wrongDevice: "Wrong Ledger device",
  invalidData: "This address can't be saved",
  appVersionTooLow: "App update required",
  genericError: "Unknown error",
} as const;

const failure = (type: string): RegisterExternalAddressJobState =>
  ({ type, error: new Error("boom") }) as RegisterExternalAddressJobState;

function renderComponent(jobState: RegisterExternalAddressJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <RegisterExternalAddressComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );

  return { user, onClose };
}

describe("RegisterExternalAddressComponentLWM", () => {
  /** `completed` is terminal: hold the spinner for the frame before the host unmounts the executor. */
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending" } as const],
    ["completed", { type: "completed" } as const],
  ])("should show the pending screen when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.pending)).toBeVisible();
  });

  it("should ask the user to continue on the device it reports", () => {
    renderComponent({
      type: "awaiting-device-confirmation",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Lily's Ledger",
    });

    expect(screen.getByText(COPY.continueOnDevice)).toBeVisible();
    expect(screen.getByText("Lily's Ledger")).toBeVisible();
  });

  it.each([
    ["device-rejected", COPY.rejected],
    ["existing-group-verification-failed", COPY.wrongDevice],
    ["invalid-input", COPY.invalidData],
    ["unsupported-operation", COPY.invalidData],
    ["app-version-too-low", COPY.appVersionTooLow],
    ["device-error", COPY.genericError],
    ["failed", COPY.genericError],
  ])("should show its error screen when the job state is %s", (type, title) => {
    renderComponent(failure(type));

    expect(screen.getByText(title)).toBeVisible();
  });

  it("should hand the flow back when the user closes an error", async () => {
    const { user, onClose } = renderComponent(failure("device-error"));

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
