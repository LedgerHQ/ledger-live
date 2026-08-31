import React from "react";
import { View } from "react-native";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { VerifyAddressIntroView } from "../VerifyAddressIntroView.native";

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

const defaultProps: React.ComponentProps<typeof VerifyAddressIntroView> = {
  isOpen: true,
  title: "Verify your address",
  description: "To protect against address replacement attacks, verify your address.",
  verifyCta: "Verify address",
  onVerify: jest.fn(),
  onClose: jest.fn(),
};

describe("VerifyAddressIntroView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render(<VerifyAddressIntroView {...defaultProps} isOpen={false} />);

    const sheet = screen.getByTestId("pay-card-verify-address-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-card-verify-address-intro")).toBeNull();
  });

  it("renders the title and description when open", () => {
    render(<VerifyAddressIntroView {...defaultProps} />);

    const sheet = screen.getByTestId("pay-card-verify-address-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText(defaultProps.title)).toBeVisible();
    expect(screen.getByText(defaultProps.description as string)).toBeVisible();
  });

  it("emits verify when the CTA is pressed", async () => {
    const user = userEvent.setup();
    const onVerify = jest.fn();
    render(<VerifyAddressIntroView {...defaultProps} onVerify={onVerify} />);

    await user.press(screen.getByTestId("pay-card-verify-address-verify-cta"));

    expect(onVerify).toHaveBeenCalledTimes(1);
  });
});
