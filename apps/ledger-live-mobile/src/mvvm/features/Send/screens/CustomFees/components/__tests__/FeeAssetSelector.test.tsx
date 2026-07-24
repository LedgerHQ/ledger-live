import React from "react";
import { render as rntlRender, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import {
  TokenCurrencySchema,
  type CryptoCurrency,
  type TokenCurrency,
} from "@domain/entity-currency";
import type { FeeAssetUiOption } from "@ledgerhq/live-common/flows/send/customFees/hooks/useCustomFeesViewModelCore";
import { FeeAssetSelector } from "../FeeAssetSelector";

function render(ui: React.ReactElement) {
  return rntlRender(
    <ThemeProvider themes={ledgerLiveThemes} colorScheme="dark">
      {ui}
    </ThemeProvider>,
  );
}

jest.mock("~/components/CurrencyIcon", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    __esModule: true,
    default: ({ currency }: { currency: { ticker: string } }) => (
      <RN.View testID={`crypto-icon-${currency.ticker}`} />
    ),
  };
});

const celoCurrency = {
  id: "celo",
  type: "CryptoCurrency",
  family: "celo",
  name: "Celo",
  ticker: "CELO",
  units: [{ name: "Celo", code: "CELO", magnitude: 18 }],
} as CryptoCurrency;

const usdtCurrency: TokenCurrency = {
  id: TokenCurrencySchema.shape.id.parse("celo/erc20/usdt"),
  type: "TokenCurrency",
  parentCurrencyId: celoCurrency.id,
  tokenType: "erc20",
  contractAddress: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};

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
  it("renders the trigger with the selected option's ticker and icon", () => {
    render(
      <FeeAssetSelector
        options={optionsWithIconsAndBalances}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    // "Pay fees in" and the selected ticker "CELO" each appear twice: once in the
    // trigger row, once inside the (eagerly-mounted) bottom sheet content.
    expect(screen.getAllByText("Pay fees in").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CELO").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("crypto-icon-CELO").length).toBeGreaterThan(0);
  });

  it("renders an icon and the formatted balance for each option", () => {
    render(
      <FeeAssetSelector
        options={optionsWithIconsAndBalances}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    expect(screen.getByTestId("send-fee-asset-icon-celo")).toBeOnTheScreen();
    expect(screen.getByTestId("send-fee-asset-balance-celo")).toHaveTextContent("2.5");

    expect(screen.getByTestId("send-fee-asset-icon-usdt-account-id")).toBeOnTheScreen();
    expect(screen.getByTestId("send-fee-asset-balance-usdt-account-id")).toHaveTextContent("10");
  });

  it("renders no icon or balance for options that don't set them (backward compatible)", () => {
    render(
      <FeeAssetSelector
        options={legacyOptions}
        selectedId="celo"
        onChange={jest.fn()}
        payFeesInLabel="Pay fees in"
      />,
    );

    expect(screen.queryByTestId("send-fee-asset-icon-celo")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("send-fee-asset-balance-celo")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("send-fee-asset-icon-cusd")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("send-fee-asset-balance-cusd")).not.toBeOnTheScreen();

    expect(screen.getByText("cUSD")).toBeOnTheScreen();
  });
});
