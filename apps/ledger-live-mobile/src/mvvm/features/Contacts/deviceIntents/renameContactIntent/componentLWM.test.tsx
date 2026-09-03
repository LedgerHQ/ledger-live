import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { RenameContactJobState } from "@features/platform-contacts/device/intents";
import { RenameContactComponentLWM } from "./componentLWM";

const COPY = {
  pending: "Preparing your Ledger device",
  continueOnDevice: "Continue on your Ledger Stax",
  rejected: "Operation rejected on Ledger device",
  wrongDevice: "Use the same Ledger device you used to add this contact",
  invalidData: "This address can't be saved",
  osVersionTooLow: "Ledger OS update required",
  genericError: "Unknown error",
} as const;

const failure = (type: string): RenameContactJobState =>
  ({ type, error: new Error("boom") }) as RenameContactJobState;

function renderComponent(jobState: RenameContactJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <RenameContactComponentLWM jobState={jobState} extraProps={undefined} onClose={onClose} />,
  );

  return { user, onClose };
}

describe("RenameContactComponentLWM", () => {
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

  /**
   * Rename is served from the dashboard, so the kit's version guard gates on the
   * OS: the shared failure state is `app-version-too-low`, but the copy is not.
   */
  it.each([
    ["device-rejected", COPY.rejected],
    ["existing-group-verification-failed", COPY.wrongDevice],
    ["invalid-input", COPY.invalidData],
    ["unsupported-operation", COPY.invalidData],
    ["app-version-too-low", COPY.osVersionTooLow],
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
});
