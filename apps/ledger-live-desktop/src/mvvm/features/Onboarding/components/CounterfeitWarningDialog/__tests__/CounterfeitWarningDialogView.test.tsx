import React from "react";
import { render, screen } from "tests/testSetup";
import CounterfeitWarningDialogView from "../CounterfeitWarningDialogView";

const defaultProps = {
  open: true,
  title: "title-key-resolved",
  primaryCtaLabel: "primary-key-resolved",
  secondaryCtaLabel: "secondary-key-resolved",
  onProceed: jest.fn(),
  onLearnMore: jest.fn(),
  onLedgerComLink: jest.fn(),
  onResellerLink: jest.fn(),
  onDismiss: jest.fn(),
};

describe("CounterfeitWarningDialogView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should hide dialog content when closed", () => {
    render(<CounterfeitWarningDialogView {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render dialog content and invoke CTA handlers when open", async () => {
    const onProceed = jest.fn();
    const onLearnMore = jest.fn();
    const onDismiss = jest.fn();
    const { user } = render(
      <CounterfeitWarningDialogView
        {...defaultProps}
        onProceed={onProceed}
        onLearnMore={onLearnMore}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("counterfeit-warning-dialog")).toBeVisible();
    expect(screen.getByText("title-key-resolved")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "primary-key-resolved" }));
    expect(onProceed).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "secondary-key-resolved" }));
    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("should call onDismiss when the dialog is closed", async () => {
    const onDismiss = jest.fn();
    const { user } = render(
      <CounterfeitWarningDialogView {...defaultProps} onDismiss={onDismiss} />,
    );

    await user.keyboard("{Escape}");
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
