import React from "react";
import { View } from "react-native";
import { cleanup, fireEvent, render, screen } from "@testing-library/react-native";
import { CardLoginIntroView } from "../CardLoginIntroView.native";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({
    children,
    isForcingToBeOpened,
    testID,
  }: {
    children: React.ReactNode;
    isForcingToBeOpened?: boolean;
    testID?: string;
  }) => (
    <View testID={testID} accessibilityState={{ expanded: !!isForcingToBeOpened }}>
      {children}
    </View>
  ),
}));

const defaultProps: React.ComponentProps<typeof CardLoginIntroView> = {
  isOpen: true,
  title: "Spend crypto, earn cashback",
  providedBy: "Card provided by Baanx",
  rows: [
    {
      icon: "CoinsAddPlus",
      title: "Uncapped 1% crypto cashback",
      description: "On all crypto card purchases with USDC, USDT, or BTC.",
    },
    {
      icon: "CreditCard",
      title: "Free virtual card",
      description: "Add to Apple Pay or Google Pay, ready instantly.",
    },
    {
      icon: "Nano",
      title: "Securely top up via Ledger Wallet",
      description: "Every transfer approved with your Ledger signer.",
    },
  ],
  actions: [
    { id: "createAccount", label: "Create an account", appearance: "base" },
    { id: "logIn", label: "Log in to Baanx", appearance: "gray" },
  ],
  onActionPress: jest.fn(),
  onClose: jest.fn(),
};

function renderIntro(props: Partial<React.ComponentProps<typeof CardLoginIntroView>> = {}) {
  return render(<CardLoginIntroView {...defaultProps} {...props} />);
}

describe("CardLoginIntroView (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the sheet mounted but renders no content while closed", () => {
    renderIntro({ isOpen: false });

    expect(screen.getByTestId("pay-card-login-intro-sheet")).toBeTruthy();
    expect(screen.queryByTestId("pay-card-login-intro-content")).toBeNull();
    expect(screen.queryByText("Spend crypto, earn cashback")).toBeNull();
  });

  it("renders the title, every row and the disclaimer once open", () => {
    renderIntro();

    expect(screen.getByText("Spend crypto, earn cashback")).toBeTruthy();
    expect(screen.getByTestId("pay-card-login-intro-hero")).toBeTruthy();
    expect(screen.getByText("Uncapped 1% crypto cashback")).toBeTruthy();
    expect(screen.getByText("On all crypto card purchases with USDC, USDT, or BTC.")).toBeTruthy();
    expect(screen.getByText("Free virtual card")).toBeTruthy();
    expect(screen.getByText("Add to Apple Pay or Google Pay, ready instantly.")).toBeTruthy();
    expect(screen.getByText("Securely top up via Ledger Wallet")).toBeTruthy();
    expect(screen.getByText("Every transfer approved with your Ledger signer.")).toBeTruthy();
    expect(screen.getByTestId("pay-card-login-intro-provided-by")).toBeTruthy();
    expect(screen.getByText("Card provided by Baanx")).toBeTruthy();
  });

  it("renders one row per icon", () => {
    renderIntro();

    expect(screen.getByTestId("pay-card-login-intro-row-CoinsAddPlus")).toBeTruthy();
    expect(screen.getByTestId("pay-card-login-intro-row-CreditCard")).toBeTruthy();
    expect(screen.getByTestId("pay-card-login-intro-row-Nano")).toBeTruthy();
  });

  it("renders both buttons, in the order the actions arrive", () => {
    renderIntro();

    expect(screen.getByLabelText("Create an account")).toBeTruthy();
    expect(screen.getByLabelText("Log in to Baanx")).toBeTruthy();
  });

  it.each(["createAccount", "logIn"] as const)("reports the %s press", id => {
    const onActionPress = jest.fn();
    renderIntro({ onActionPress });

    fireEvent.press(screen.getByTestId(`pay-card-login-intro-${id}`));

    expect(onActionPress).toHaveBeenCalledTimes(1);
  });

  it("reports every press, because the view model drops the second one", () => {
    const onActionPress = jest.fn();
    const onClose = jest.fn();
    renderIntro({ onActionPress, onClose });

    fireEvent.press(screen.getByTestId("pay-card-login-intro-createAccount"));
    fireEvent.press(screen.getByTestId("pay-card-login-intro-logIn"));

    expect(onActionPress).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
  });
});
