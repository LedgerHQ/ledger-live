import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerifyAddressIntroView } from "../VerifyAddressIntroView.web";

const defaultProps: React.ComponentProps<typeof VerifyAddressIntroView> = {
  isOpen: true,
  title: "Verify your address",
  description: "To protect against address replacement attacks, verify your address.",
  verifyCta: "Verify address",
  onVerify: jest.fn(),
  onClose: jest.fn(),
};

describe("VerifyAddressIntroView (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the title and description when open", () => {
    render(<VerifyAddressIntroView {...defaultProps} />);

    expect(screen.getByTestId("pay-card-verify-address-intro")).toBeVisible();
    expect(screen.getByText(defaultProps.title)).toBeVisible();
    expect(screen.getByText(defaultProps.description as string)).toBeVisible();
  });

  it("renders nothing when closed", () => {
    render(<VerifyAddressIntroView {...defaultProps} isOpen={false} />);

    expect(screen.queryByTestId("pay-card-verify-address-intro")).toBeNull();
  });

  it("emits verify when the CTA is clicked", async () => {
    const user = userEvent.setup();
    const onVerify = jest.fn();
    render(<VerifyAddressIntroView {...defaultProps} onVerify={onVerify} />);

    await user.click(screen.getByTestId("pay-card-verify-address-verify-cta"));

    expect(onVerify).toHaveBeenCalledTimes(1);
  });
});
