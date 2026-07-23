/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { FeeAssetUiOption } from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import { FeeAssetSelector } from "../FeeAssetSelector";

jest.mock("~/renderer/components/CryptoCurrencyIcon", () => ({
  __esModule: true,
  default: ({ currency }: { currency: { ticker: string } }) => (
    <span data-testid={`crypto-icon-${currency.ticker}`} />
  ),
}));

const celoCurrency = {
  id: "celo",
  type: "CryptoCurrency",
  family: "celo",
  name: "Celo",
  ticker: "CELO",
  units: [{ name: "Celo", code: "CELO", magnitude: 18 }],
} as CryptoCurrency;

const usdtCurrency = {
  id: "celo/erc20/usdt",
  type: "TokenCurrency",
  parentCurrencyId: celoCurrency.id,
  tokenType: "erc20",
  contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
} as TokenCurrency;

const optionsWithIconsAndBalances: readonly FeeAssetUiOption[] = [
  {
    id: "celo",
    ticker: "CELO",
    label: "CELO",
    unitLabel: "Gwei",
    currency: celoCurrency,
    formattedBalance: "2.5",
  },
  {
    id: "usdt-account-id",
    ticker: "USDT",
    label: "USDT",
    currency: usdtCurrency,
    formattedBalance: "10",
  },
];

// Legacy-shaped options (no currency/formattedBalance) — must render exactly as before.
const legacyOptions: readonly FeeAssetUiOption[] = [
  { id: "celo", ticker: "CELO", label: "CELO", unitLabel: "Gwei" },
  { id: "cusd", ticker: "cUSD", label: "cUSD" },
];

describe("FeeAssetSelector", () => {
  it("renders the trigger with the selected option's ticker", () => {
    render(
      <FeeAssetSelector
        options={optionsWithIconsAndBalances}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    expect(screen.getByTestId("send-fee-asset-select")).toBeInTheDocument();
    expect(screen.getByText("Pay fees in")).toBeInTheDocument();
    expect(screen.getByText("CELO")).toBeInTheDocument();
  });

  it("renders an icon and the formatted balance for each option once opened", async () => {
    const { user } = render(
      <FeeAssetSelector
        options={optionsWithIconsAndBalances}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    await user.click(screen.getByTestId("send-fee-asset-select"));

    const celoOption = await screen.findByTestId("send-fee-asset-option-celo");
    expect(celoOption).toBeInTheDocument();
    expect(screen.getByTestId("send-fee-asset-icon-celo")).toBeInTheDocument();
    expect(screen.getByTestId("send-fee-asset-balance-celo")).toHaveTextContent("2.5");

    const usdtOption = screen.getByTestId("send-fee-asset-option-usdt-account-id");
    expect(usdtOption).toBeInTheDocument();
    expect(screen.getByTestId("send-fee-asset-icon-usdt-account-id")).toBeInTheDocument();
    expect(screen.getByTestId("send-fee-asset-balance-usdt-account-id")).toHaveTextContent("10");
  });

  it("renders no icon or balance for options that don't set them (backward compatible)", async () => {
    const { user } = render(
      <FeeAssetSelector
        options={legacyOptions}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    await user.click(screen.getByTestId("send-fee-asset-select"));

    await screen.findByTestId("send-fee-asset-option-celo");
    expect(screen.queryByTestId("send-fee-asset-icon-celo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-fee-asset-balance-celo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-fee-asset-icon-cusd")).not.toBeInTheDocument();
    expect(screen.queryByTestId("send-fee-asset-balance-cusd")).not.toBeInTheDocument();

    expect(screen.getByText("cUSD")).toBeInTheDocument();
  });

  it("calls onChange with the option id when an option is selected", async () => {
    const onChange = jest.fn();
    const { user } = render(
      <FeeAssetSelector
        options={optionsWithIconsAndBalances}
        selectedId="celo"
        onChange={onChange}
        payFeesInLabel="Pay fees in"
      />,
    );

    await user.click(screen.getByTestId("send-fee-asset-select"));
    const usdtOption = await screen.findByTestId("send-fee-asset-option-usdt-account-id");
    await user.click(usdtOption);

    expect(onChange).toHaveBeenCalledWith("usdt-account-id");
  });
});
