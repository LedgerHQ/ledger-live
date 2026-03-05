import React from "react";
import { render, screen } from "@tests/test-renderer";
import MarketRowItem from "../index";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";

const bitcoinItem = MOCK_MARKET_CURRENCY_DATA[0];

describe("MarketRowItem", () => {
  it("should render item details", () => {
    render(<MarketRowItem item={bitcoinItem} index={0} counterCurrency="usd" range="24h" />);
    expect(screen.getByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("2.50%")).toBeOnTheScreen();
  });

  it("should render fallback image when no ledgerIds", () => {
    const item = { ...bitcoinItem, ledgerIds: [] };
    render(<MarketRowItem item={item} index={0} counterCurrency="usd" range="24h" />);
    expect(screen.getByLabelText("currency logo")).toBeOnTheScreen();
  });

  it("should not render fallback image when ledgerIds and ticker are available", () => {
    render(<MarketRowItem item={bitcoinItem} index={0} counterCurrency="usd" range="24h" />);
    expect(screen.queryByLabelText("currency logo")).toBeNull();
  });
});
