import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyAddressSuccessView } from "../VerifyAddressSuccessView.web";

const defaultProps: React.ComponentProps<typeof VerifyAddressSuccessView> = {
  isOpen: true,
  title: "Address displayed on the device's Secure Screen",
  nextStepsLabel: "Next steps",
  nextSteps: [
    { index: 1, label: "Share your address via your desired app" },
    { index: 2, label: "Ensure the shared address matches the one on your Ledger Device." },
  ],
  gotItCta: "Got it",
  onGotIt: jest.fn(),
  onClose: jest.fn(),
};

describe("VerifyAddressSuccessView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and next steps when open", () => {
    render(<VerifyAddressSuccessView {...defaultProps} />);

    expect(screen.getByTestId("pay-card-verify-address-success")).toBeVisible();
    expect(screen.getByText(defaultProps.title)).toBeVisible();
    expect(screen.getByText(defaultProps.nextSteps[0].label)).toBeVisible();
    expect(screen.getByText(defaultProps.nextSteps[1].label)).toBeVisible();
  });

  it("renders nothing when closed", () => {
    render(<VerifyAddressSuccessView {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("pay-card-verify-address-success")).toBeNull();
  });

  it("emits got it when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const onGotIt = jest.fn();
    render(<VerifyAddressSuccessView {...defaultProps} onGotIt={onGotIt} />);

    await user.click(screen.getByTestId("pay-card-verify-address-got-it-cta"));

    expect(onGotIt).toHaveBeenCalledTimes(1);
  });
});
