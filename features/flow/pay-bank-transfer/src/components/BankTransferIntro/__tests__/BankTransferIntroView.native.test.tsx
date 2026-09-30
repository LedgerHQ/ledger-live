import React from "react";
import { cleanup, fireEvent, render as renderNative, screen } from "@testing-library/react-native";
import { trackedPages } from "@features/platform-pay-analytics/testing/module-mock";
import { BankTransferIntroView } from "../BankTransferIntroView.native";
import type { BankTransferIntroViewProps } from "../../../types";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

const defaultProps: BankTransferIntroViewProps = {
  isOpen: true,
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
  onCreateAccountPress: jest.fn(),
  onLogInPress: jest.fn(),
  onClosePress: jest.fn(),
  onDismiss: jest.fn(),
};

function render(props: Partial<BankTransferIntroViewProps> = {}) {
  return renderNative(<BankTransferIntroView {...defaultProps} {...props} />);
}

describe("BankTransferIntroView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("tracks the cash to stable feature intro page while open", () => {
    render();

    expect(trackedPages()).toContainEqual({
      page: "Feature Intro",
      name: "Cash to stable",
      flow: "Cash to stable",
    });
  });

  it("does not track the page while closed", () => {
    render({ isOpen: false });

    expect(trackedPages()).toHaveLength(0);
  });

  it("keeps the sheet mounted but hides its content while closed", () => {
    render({ isOpen: false });

    const sheet = screen.getByTestId("pay-bank-transfer-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByTestId("pay-bank-transfer-intro-content")).toBeNull();
  });

  it("forces the sheet open and renders the intro copy", () => {
    render();

    const sheet = screen.getByTestId("pay-bank-transfer-intro-sheet");
    expect(sheet.props.accessibilityState.expanded).toBe(true);
    expect(screen.getByText("Convert cash to stablecoins")).toBeTruthy();
    expect(screen.getByLabelText("Create an account")).toBeTruthy();
    expect(screen.queryByTestId("pay-bank-transfer-intro-hero")).toBeNull();
  });

  it("renders the host-bundled hero when provided", () => {
    render({ heroImage: 1 });

    const hero = screen.getByTestId("pay-bank-transfer-intro-hero");
    expect(hero).toBeTruthy();
    expect(hero.props.style).toEqual(
      expect.objectContaining({ width: "100%", height: 192, borderRadius: 12 }),
    );
    expect(hero.props.resizeMode).toBe("cover");
  });

  it("creates an account once even if the CTA is pressed repeatedly", () => {
    const onCreateAccountPress = jest.fn();
    render({ onCreateAccountPress });

    const cta = screen.getByLabelText("Create an account");
    fireEvent.press(cta);
    fireEvent.press(cta);

    expect(onCreateAccountPress).toHaveBeenCalledTimes(1);
  });

  it("tracks header close", () => {
    const onClosePress = jest.fn();
    render({ onClosePress });

    fireEvent.press(screen.getByTestId("pay-bank-transfer-intro-sheet-header-close"));
    expect(onClosePress).toHaveBeenCalledTimes(1);
  });
});
