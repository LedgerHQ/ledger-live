import React from "react";
import { Pressable, View } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { BankTransferIntroView } from "../BankTransferIntroView.native";
import type { BankTransferIntroViewProps } from "../../../types";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isForcingToBeOpened,
    onHeaderClosePressed,
    testID,
  }: {
    children: React.ReactNode;
    isForcingToBeOpened?: boolean;
    onHeaderClosePressed?: () => void;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isForcingToBeOpened }}>
      <Pressable
        onPress={onHeaderClosePressed}
        testID="pay-bank-transfer-intro-header-close"
        accessibilityRole="button"
      />
      {children}
    </View>
  ),
}));

const defaultProps: BankTransferIntroViewProps = {
  isOpen: true,
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
  bottomInset: 0,
  onShown: jest.fn(),
  onCreateAccountPress: jest.fn(),
  onLogInPress: jest.fn(),
  onClosePress: jest.fn(),
  onDismiss: jest.fn(),
};

describe("BankTransferIntroView (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("signals it was shown once across re-renders", () => {
    const onShown = jest.fn();
    const { rerender } = render(<BankTransferIntroView {...defaultProps} onShown={onShown} />);

    rerender(<BankTransferIntroView {...defaultProps} onShown={onShown} />);

    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it("does not signal it was shown while closed", () => {
    const onShown = jest.fn();
    render(<BankTransferIntroView {...defaultProps} isOpen={false} onShown={onShown} />);

    expect(onShown).not.toHaveBeenCalled();
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render(<BankTransferIntroView {...defaultProps} isOpen={false} />);

    const sheet = screen.getByTestId("pay-bank-transfer-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-bank-transfer-intro-content")).toBeNull();
  });

  it("forces the sheet open and renders the intro copy", () => {
    render(<BankTransferIntroView {...defaultProps} />);

    const sheet = screen.getByTestId("pay-bank-transfer-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("Convert cash to stablecoins")).toBeTruthy();
    expect(screen.getByLabelText("Create an account")).toBeTruthy();
    expect(screen.queryByTestId("pay-bank-transfer-intro-hero")).toBeNull();
  });

  it("renders the host-bundled hero when provided", () => {
    render(<BankTransferIntroView {...defaultProps} heroImage={1} />);

    const hero = screen.getByTestId("pay-bank-transfer-intro-hero");
    expect(hero).toBeTruthy();
    expect(hero.props.style).toEqual(
      expect.objectContaining({ width: "100%", height: 192, borderRadius: 12 }),
    );
    expect(hero.props.resizeMode).toBe("cover");
  });

  it("reserves the bottom safe area so the CTA stays visible", () => {
    render(<BankTransferIntroView {...defaultProps} bottomInset={48} />);

    const content = screen.getByTestId("pay-bank-transfer-intro-content");
    expect(content.props.style.paddingBottom).toBeGreaterThanOrEqual(48);
  });

  it("creates an account once even if the CTA is pressed repeatedly", () => {
    const onCreateAccountPress = jest.fn();
    render(<BankTransferIntroView {...defaultProps} onCreateAccountPress={onCreateAccountPress} />);

    const cta = screen.getByLabelText("Create an account");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
  });

  it("tracks header close", () => {
    const onClosePress = jest.fn();
    render(<BankTransferIntroView {...defaultProps} onClosePress={onClosePress} />);

    fireEvent.press(screen.getByTestId("pay-bank-transfer-intro-header-close"));
    expect(onClosePress).toHaveBeenCalledTimes(1);
  });
});
