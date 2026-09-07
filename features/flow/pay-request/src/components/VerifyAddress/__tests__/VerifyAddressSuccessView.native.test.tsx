import React from "react";
import { View } from "react-native";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { VerifyAddressSuccessView } from "../VerifyAddressSuccessView.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isRequestingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isRequestingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isRequestingToBeOpened }}>
      {children}
    </View>
  ),
}));

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

describe("VerifyAddressSuccessView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render(<VerifyAddressSuccessView {...defaultProps} isOpen={false} />);

    const sheet = screen.getByTestId("pay-card-verify-address-success-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-card-verify-address-success")).toBeNull();
  });

  it("renders the title and next steps when open", () => {
    render(<VerifyAddressSuccessView {...defaultProps} />);

    const sheet = screen.getByTestId("pay-card-verify-address-success-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText(defaultProps.title)).toBeVisible();
    expect(screen.getByText(defaultProps.nextSteps[0].label)).toBeVisible();
    expect(screen.getByText(defaultProps.nextSteps[1].label)).toBeVisible();
  });

  it("emits got it when the CTA is pressed", async () => {
    const user = userEvent.setup();
    const onGotIt = jest.fn();
    render(<VerifyAddressSuccessView {...defaultProps} onGotIt={onGotIt} />);

    await user.press(screen.getByTestId("pay-card-verify-address-got-it-cta"));

    expect(onGotIt).toHaveBeenCalledTimes(1);
  });
});
