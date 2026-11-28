import React from "react";
import { render, screen } from "tests/testSetup";
import { CryptoAddressesBannerView } from "../CryptoAddressesBannerView";
import { Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: ({ ledgerId, ticker }: { ledgerId: string; ticker: string }) => (
    <div data-testid={`crypto-icon-${ledgerId}`}>{ticker}</div>
  ),
}));

const bitcoin = { type: "CryptoCurrency", id: "bitcoin", ticker: "BTC" } as CryptoCurrency;

const defaultProps = {
  title: "Add account",
  description: "You have no accounts",
  icon: Wallet,
  onGoToAccounts: jest.fn(),
  onAddAccount: jest.fn(),
  firstThreeCurrencies: [],
  buttonText: undefined,
};

describe("CryptoAddressesBannerView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render title and description", () => {
    render(<CryptoAddressesBannerView {...defaultProps} />);

    expect(screen.getByText("Add account")).toBeVisible();
    expect(screen.getByText("You have no accounts")).toBeVisible();
  });

  it("should render a squared icon for each banner currency", () => {
    render(<CryptoAddressesBannerView {...defaultProps} firstThreeCurrencies={[bitcoin]} />);

    expect(screen.getByTestId("crypto-icon-bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });

  it("should render the crypto addresses banner with test id", () => {
    render(<CryptoAddressesBannerView {...defaultProps} />);

    expect(screen.getByTestId("crypto-addresses-banner")).toBeVisible();
  });

  it("should call onAddAccount when the button is clicked", async () => {
    const onAddAccount = jest.fn();
    const { user } = render(
      <CryptoAddressesBannerView {...defaultProps} onAddAccount={onAddAccount} buttonText="Add" />,
    );

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAddAccount).toHaveBeenCalledTimes(1);
  });

  it("should call onGoToAccounts when Enter is pressed while the banner is focused", async () => {
    const onGoToAccounts = jest.fn();
    const { user } = render(
      <CryptoAddressesBannerView {...defaultProps} onGoToAccounts={onGoToAccounts} />,
    );

    await user.tab();
    await user.keyboard("{Enter}");

    expect(onGoToAccounts).toHaveBeenCalledTimes(1);
  });

  it("should call onGoToAccounts when Space is pressed while the banner is focused", async () => {
    const onGoToAccounts = jest.fn();
    const { user } = render(
      <CryptoAddressesBannerView {...defaultProps} onGoToAccounts={onGoToAccounts} />,
    );

    await user.tab();
    await user.keyboard(" ");

    expect(onGoToAccounts).toHaveBeenCalledTimes(1);
  });
});
