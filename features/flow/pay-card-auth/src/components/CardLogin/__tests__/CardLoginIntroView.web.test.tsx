import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CardLoginIntroView } from "../CardLoginIntroView.web";

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
      icon: "LedgerLogo",
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

describe("CardLoginIntroView (Web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders nothing while closed", () => {
    renderIntro({ isOpen: false });

    expect(screen.queryByTestId("pay-card-login-intro-dialog")).toBeNull();
    expect(screen.queryByText("Spend crypto, earn cashback")).toBeNull();
  });

  it("renders the title, every row and the disclaimer once open", () => {
    renderIntro();

    expect(screen.getByTestId("pay-card-login-intro-dialog")).toBeVisible();
    expect(screen.getByText("Spend crypto, earn cashback")).toBeVisible();
    expect(screen.getByTestId("pay-card-login-intro-hero")).toBeVisible();
    expect(screen.getByText("Uncapped 1% crypto cashback")).toBeVisible();
    expect(screen.getByText("On all crypto card purchases with USDC, USDT, or BTC.")).toBeVisible();
    expect(screen.getByText("Free virtual card")).toBeVisible();
    expect(screen.getByText("Add to Apple Pay or Google Pay, ready instantly.")).toBeVisible();
    expect(screen.getByText("Securely top up via Ledger Wallet")).toBeVisible();
    expect(screen.getByText("Every transfer approved with your Ledger signer.")).toBeVisible();
    expect(screen.getByTestId("pay-card-login-intro-provided-by")).toHaveTextContent(
      "Card provided by Baanx",
    );
  });

  it("renders one row per icon", () => {
    renderIntro();

    expect(screen.getByTestId("pay-card-login-intro-row-CoinsAddPlus")).toBeVisible();
    expect(screen.getByTestId("pay-card-login-intro-row-CreditCard")).toBeVisible();
    expect(screen.getByTestId("pay-card-login-intro-row-LedgerLogo")).toBeVisible();
  });

  it("renders both buttons, in the order the actions arrive", () => {
    renderIntro();

    expect(screen.getByTestId("pay-card-login-intro-createAccount")).toHaveTextContent(
      "Create an account",
    );
    expect(screen.getByTestId("pay-card-login-intro-logIn")).toHaveTextContent("Log in to Baanx");
  });

  it.each(["createAccount", "logIn"] as const)("reports the %s click", id => {
    const onActionPress = jest.fn();
    renderIntro({ onActionPress });

    fireEvent.click(screen.getByTestId(`pay-card-login-intro-${id}`));

    expect(onActionPress).toHaveBeenCalledTimes(1);
    expect(onActionPress).toHaveBeenCalledWith(id);
  });

  it("reports every click, because the view model drops the second one", () => {
    const onActionPress = jest.fn();
    const onClose = jest.fn();
    renderIntro({ onActionPress, onClose });

    fireEvent.click(screen.getByTestId("pay-card-login-intro-createAccount"));
    fireEvent.click(screen.getByTestId("pay-card-login-intro-logIn"));

    expect(onActionPress).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("reports the header close press", () => {
    const onClose = jest.fn();
    const onActionPress = jest.fn();
    renderIntro({ onClose, onActionPress });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onActionPress).not.toHaveBeenCalled();
  });

  it("reports close only once when the header close also dismisses the dialog", () => {
    const onClose = jest.fn();
    renderIntro({ onClose });

    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
