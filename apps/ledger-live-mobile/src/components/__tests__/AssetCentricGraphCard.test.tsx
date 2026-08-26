import React from "react";
import { Text } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import type { Portfolio } from "@ledgerhq/types-live";
import { render, screen } from "@tests/test-renderer";
import AssetCentricGraphCard from "../AssetCentricGraphCard";

jest.mock("../Graph", () => () => <Text testID="asset-graph" />);
jest.mock("../CurrencyIcon", () => () => null);
jest.mock("../CurrencyUnitValue", () => ({ value }: { value: number }) => (
  <Text>{String(value)}</Text>
));
jest.mock("../CounterValue", () => ({
  NoCountervaluePlaceholder: () => <Text>-</Text>,
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const currentPositionY = { value: 0 } as SharedValue<number>;

const makePortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  balanceHistory: [{ date: new Date("2026-08-26T00:00:00.000Z"), value: 100 }],
  balanceAvailable: true,
  countervalueComplete: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day",
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange: { value: 0, percentage: 0 },
  ...overrides,
});

const renderCard = (assetPortfolio: Portfolio, currencyBalance = 1) =>
  render(
    <AssetCentricGraphCard
      assetPortfolio={assetPortfolio}
      counterValueCurrency={usd}
      currentPositionY={currentPositionY}
      graphCardEndPosition={100}
      currency={bitcoin}
      currencyBalance={currencyBalance}
    />,
  );

describe("AssetCentricGraphCard", () => {
  it("keeps the crypto balance but hides fiat, trend and graph when the current rate is missing", () => {
    renderCard(
      makePortfolio({
        countervalueComplete: false,
        countervalueChange: { value: 0, percentage: null },
      }),
    );

    expect(screen.getByTestId("asset-graph-balance")).toHaveTextContent("1");
    expect(screen.getByTestId("asset-graph-countervalue")).toHaveTextContent("-");
    expect(screen.getByTestId("asset-graph-trend-unavailable")).toHaveTextContent("-");
    expect(screen.queryByTestId("asset-graph")).toBeNull();
  });

  it("renders a real zero value and a flat graph", () => {
    renderCard(makePortfolio({ balanceHistory: [{ date: new Date(), value: 0 }] }), 0);

    expect(screen.getByTestId("asset-graph-countervalue")).toHaveTextContent("0");
    expect(screen.getByTestId("asset-graph-balance")).toHaveTextContent("0");
    expect(screen.getByTestId("asset-graph")).toBeVisible();
  });
});
