import React from "react";
import { render, screen } from "tests/testSetup";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { SignTransactionIntentWithResultJobState } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignedOperation } from "@ledgerhq/types-live";
import { StakePositionSignatureComponentLWD } from "../componentLWD";

const COPY = {
  continueOnDevice: "Continue on your Ledger Flex",
  secureScreen: "Follow the instructions displayed on your Secure Screen.",
  processing: "This can take a few minutes.",
} as const;

const retry = () => undefined;

function renderComponent(
  jobState: SignTransactionIntentWithResultJobState | undefined,
  deviceName = "Lily's Ledger",
) {
  return render(
    <StakePositionSignatureComponentLWD
      jobState={jobState}
      extraProps={{ deviceName }}
      onClose={jest.fn()}
    />,
  );
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
    renderComponent({ type: "pending", deviceModelId: DeviceModelId.europa }, "");

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
  ])("should say the transaction is being processed when the job is %s", (_, jobState) => {
    renderComponent(jobState);

    expect(screen.getByText(COPY.processing)).toBeVisible();
  });

  it.each([
    ["undefined", undefined],
    ["cancelled", { type: "cancelled", retry } as const],
    ["error", { type: "error", error: new Error("boom"), retry } as const],
  ])(
    "should show nothing when the job is %s: the stake position dialog takes over",
    (_, jobState) => {
      renderComponent(jobState);

      expect(screen.queryByText(COPY.continueOnDevice)).not.toBeInTheDocument();
      expect(screen.queryByText(COPY.processing)).not.toBeInTheDocument();
    },
  );
});
