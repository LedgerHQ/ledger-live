import React from "react";
import { render, screen } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { VerifyAddressIntentJobState } from "@features/platform-verify-address-intent";
import { VerifyAddressIntentComponentLWM } from "../componentLWM";

const ADDRESS = "0xAbC0000000000000000000000000000000000001";

const COPY = {
  nextStepsTitle: "Address displayed on the device's Secure Screen",
  nextStepShare: "Share your address via your desired app.",
  nextStepMatch: "Ensure the shared address matches the one on your Ledger Device.",
  cancelledTitle: "Address verification cancelled",
  cancelledDescription:
    "You declined the address on your device. You can display it again to verify it.",
  mismatchTitle: "Addresses don't match",
  mismatchDescription:
    "The address shown on your device is different from the requested one. Do not share this address.",
  unsupportedTitle: "Verification not available",
  unsupportedDescription: "This device app can't display the address for on-device verification.",
  gotIt: "Got it",
  close: "Close",
  retry: "Show address again",
} as const;

const jobStates = {
  verifying: (): VerifyAddressIntentJobState => ({
    type: "verifying",
    deviceModelId: DeviceModelId.STAX,
    deviceName: "Ledger Stax",
  }),
  verified: (): VerifyAddressIntentJobState => ({ type: "verified", address: ADDRESS }),
  cancelled: (retry: () => void = jest.fn()): VerifyAddressIntentJobState => ({
    type: "cancelled",
    retry,
  }),
  mismatch: (): VerifyAddressIntentJobState => ({
    type: "mismatch",
    expectedAddress: ADDRESS,
    reportedAddress: "0xDEAD",
  }),
  unsupported: (): VerifyAddressIntentJobState => ({
    type: "unsupported",
    error: new Error("cannot display"),
  }),
};

function renderComponent(jobState: VerifyAddressIntentJobState | undefined) {
  const onClose = jest.fn();
  const { user } = render(
    <VerifyAddressIntentComponentLWM
      jobState={jobState}
      extraProps={undefined}
      onClose={onClose}
    />,
  );

  return { user, onClose };
}

describe("VerifyAddressIntentComponentLWM", () => {
  describe("when the job has not emitted a state yet", () => {
    it("should render nothing", () => {
      renderComponent(undefined);

      expect(screen.queryByText(COPY.nextStepsTitle)).toBeNull();
    });
  });

  describe.each([
    ["verifying", jobStates.verifying],
    ["verified", jobStates.verified],
  ])("when the job state is %s", (_, buildJobState) => {
    it("should show the next steps to follow while the address is on the Secure Screen", () => {
      renderComponent(buildJobState());

      expect(screen.getByText(COPY.nextStepsTitle)).toBeVisible();
      expect(screen.getByText(COPY.nextStepShare)).toBeVisible();
      expect(screen.getByText(COPY.nextStepMatch)).toBeVisible();
    });

    it("should hand the flow back when the user presses Got it", async () => {
      const { user, onClose } = renderComponent(buildJobState());

      await user.press(screen.getByRole("button", { name: COPY.gotIt }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe.each([
    {
      state: "cancelled",
      buildJobState: () => jobStates.cancelled(),
      title: COPY.cancelledTitle,
      description: COPY.cancelledDescription,
    },
    {
      state: "mismatch",
      buildJobState: jobStates.mismatch,
      title: COPY.mismatchTitle,
      description: COPY.mismatchDescription,
    },
    {
      state: "unsupported",
      buildJobState: jobStates.unsupported,
      title: COPY.unsupportedTitle,
      description: COPY.unsupportedDescription,
    },
  ])("when the job state is $state", ({ buildJobState, title, description }) => {
    it("should explain the outcome to the user", () => {
      renderComponent(buildJobState());

      expect(screen.getByText(title)).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
    });

    it("should hand the flow back when the user presses Close", async () => {
      const { user, onClose } = renderComponent(buildJobState());

      await user.press(screen.getByRole("button", { name: COPY.close }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the job state is cancelled", () => {
    it("should display the address again when the user presses the retry CTA", async () => {
      const retry = jest.fn();
      const { user } = renderComponent(jobStates.cancelled(retry));

      await user.press(screen.getByRole("button", { name: COPY.retry }));

      expect(retry).toHaveBeenCalledTimes(1);
    });
  });
});
