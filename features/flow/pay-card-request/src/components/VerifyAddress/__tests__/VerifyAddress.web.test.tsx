import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyAddress } from "../VerifyAddress";
import type { VerifyAddressLabels, VerifyAddressProps } from "../../../types";

const LABELS: VerifyAddressLabels = {
  introTitle: "Verify your address",
  introDescription: "To protect against address replacement attacks, verify your address.",
  verifyCta: "Verify address",
  successTitle: "Address displayed on the device's Secure Screen",
  nextStepsLabel: "Next steps",
  nextStepShare: "Share your address via your desired app",
  nextStepMatch: "Ensure the shared address matches the one on your Ledger Device.",
  gotItCta: "Got it",
};

function renderVerifyAddress(overrides: Partial<VerifyAddressProps> = {}) {
  const props: VerifyAddressProps = {
    phase: "intro",
    labels: LABELS,
    page: "Pay",
    onVerify: jest.fn(),
    onGotIt: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<VerifyAddress {...props} />) };
}

describe("VerifyAddress (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing while hidden", () => {
    renderVerifyAddress({ phase: "hidden" });

    expect(screen.queryByTestId("pay-card-verify-address-intro")).toBeNull();
    expect(screen.queryByTestId("pay-card-verify-address-success")).toBeNull();
  });

  it("tracks and starts the device intent from the intro CTA", async () => {
    const user = userEvent.setup();
    const { props } = renderVerifyAddress();

    expect(screen.getByTestId("pay-card-verify-address-intro")).toBeVisible();

    await user.click(screen.getByTestId("pay-card-verify-address-verify-cta"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "verify address",
      buttonLocation: "verify address",
      page: "Pay",
    });
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });

  it("renders the next steps and closes from the success CTA", async () => {
    const user = userEvent.setup();
    const { props } = renderVerifyAddress({ phase: "success" });

    expect(screen.getByTestId("pay-card-verify-address-success")).toBeVisible();

    await user.click(screen.getByTestId("pay-card-verify-address-got-it-cta"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      buttonLocation: "verify address",
      page: "Pay",
    });
    expect(props.onGotIt).toHaveBeenCalledTimes(1);
  });
});
