import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { EditExternalAddressJobState } from "@features/platform-contacts/device/intents";
import { EditExternalAddressComponentLWM } from "./componentLWM";

const COPY = {
  pending: "Preparing your Ledger device",
  continueOnDevice: "Continue on your Ledger Stax",
  rejected: "Operation rejected on Ledger device",
  wrongDevice: "Use the same Ledger device you used to add this contact",
  invalidData: "This address can't be saved",
  appVersionTooLow: "App update required",
  genericError: "Unknown error",
} as const;

const failure = (type: string): EditExternalAddressJobState =>
  ({ type, error: new Error("boom") }) as EditExternalAddressJobState;

function renderComponent(jobState: EditExternalAddressJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <EditExternalAddressComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );

  return { user, onClose };
}

describe("EditExternalAddressComponentLWM", () => {
  /**
   * `partial-result` sits between two approved steps and `completed` is
   * terminal: both hold the spinner for the frame before the host unmounts the
   * executor.
   */
  it.each([
    ["undefined", undefined],
    ["pending", { type: "pending" } as const],
    ["partial-result", { type: "partial-result" } as const],
    ["completed", { type: "completed" } as const],
  ])("should show the pending screen when the job state is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.pending)).toBeVisible();
  });

  it("should ask the user to continue on the device it reports", () => {
    renderComponent({
      type: "awaiting-device-confirmation",
      step: "identifier",
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
    ["failed", COPY.genericError],
  ])("should show its error screen when the job state is %s", (type, title) => {
    renderComponent(failure(type));

    expect(screen.getByText(title)).toBeVisible();
  });

  it("should let the user replay the device action when the rejection carries a retry", async () => {
    const retry = jest.fn();
    const { user } = renderComponent({
      type: "device-rejected",
      error: new Error("SWO_INCORRECT_DATA"),
      retry,
    });

    await user.press(screen.getByText("Retry"));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("should not offer a retry when the rejection carries none", () => {
    renderComponent(failure("device-rejected"));

    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("should hand the flow back when the user closes an error", async () => {
    const { user, onClose } = renderComponent(failure("failed"));

    await user.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should show the same waiting screen for both confirmations of a combined edit", () => {
    // The two steps are deliberately not numbered: the on-device screens are
    // what distinguish them.
    renderComponent({
      type: "awaiting-device-confirmation",
      step: "scope",
      deviceModelId: DeviceModelId.STAX,
      deviceName: "Lily's Ledger",
    });

    expect(screen.getByText(COPY.continueOnDevice)).toBeVisible();
  });
});
