import {
  countervalueChangeFromDayPercent,
  heldMarketDayChange,
  withHeldDayChange,
} from "./heldMarketDayChange";

const ETH = {
  id: "ethereum",
  ticker: "eth",
  ledgerIds: ["ethereum", "base", "optimism"],
  priceChangePercentage24h: -5.41,
};
const OP = {
  id: "optimism",
  ticker: "op",
  ledgerIds: ["optimism", "ethereum/erc20/optimism"],
  priceChangePercentage24h: 3.2,
};
const USDC = {
  id: "usd-coin",
  ticker: "usdc",
  ledgerIds: ["ethereum/erc20/usd__coin"],
  priceChangePercentage24h: 0.01,
};

describe("heldMarketDayChange", () => {
  it("keys the change by held ledger id and by market id", () => {
    const { byLedgerId, byMarketId } = heldMarketDayChange(
      [USDC],
      [{ id: "ethereum/erc20/usd__coin", ticker: "USDC" }],
    );

    expect(byLedgerId.get("ethereum/erc20/usd__coin")).toBe(0.01);
    expect(byMarketId.get("usd-coin")).toBe(0.01);
  });

  it("pairs a network id with the market of its native coin rather than its namesake token", () => {
    const { byLedgerId } = heldMarketDayChange(
      [OP, ETH],
      [
        { id: "optimism", ticker: "ETH" },
        { id: "ethereum/erc20/optimism", ticker: "OP" },
      ],
    );

    expect(byLedgerId.get("optimism")).toBe(-5.41);
    expect(byLedgerId.get("ethereum/erc20/optimism")).toBe(3.2);
  });

  it("falls back to the market with the same id when no ticker matches", () => {
    const { byLedgerId } = heldMarketDayChange([ETH, OP], [{ id: "optimism", ticker: "XYZ" }]);

    expect(byLedgerId.get("optimism")).toBe(3.2);
  });

  it("lists the other networks of a held market so grouped portfolio rows resolve", () => {
    const { byLedgerId } = heldMarketDayChange([ETH], [{ id: "base", ticker: "ETH" }]);

    expect(byLedgerId.get("ethereum")).toBe(-5.41);
  });

  it("ignores markets with no finite 24h change and markets without ledger ids", () => {
    const { byLedgerId, byMarketId } = heldMarketDayChange(
      [
        { id: "bitcoin", ticker: "btc", priceChangePercentage24h: Number.NaN },
        { id: "solana", ticker: "sol", priceChangePercentage24h: 2 },
      ],
      [
        { id: "bitcoin", ticker: "BTC" },
        { id: "solana", ticker: "SOL" },
      ],
    );

    expect(byLedgerId.has("bitcoin")).toBe(false);
    expect(byMarketId.has("bitcoin")).toBe(false);
    expect(byLedgerId.get("solana")).toBe(2);
  });
});

describe("withHeldDayChange", () => {
  it("replaces the 24h change of held items only", () => {
    const items = [
      { id: "ethereum", priceChangePercentage24h: -5.42 },
      { id: "bitcoin", priceChangePercentage24h: 1.36 },
    ];

    expect(withHeldDayChange(items, new Map([["ethereum", -5.41]]))).toEqual([
      { id: "ethereum", priceChangePercentage24h: -5.41 },
      { id: "bitcoin", priceChangePercentage24h: 1.36 },
    ]);
  });
});

describe("countervalueChangeFromDayPercent", () => {
  it("derives the day variation of the current countervalue", () => {
    const change = countervalueChangeFromDayPercent(110, 10);

    expect(change?.percentage).toBe(0.1);
    expect(change?.value).toBeCloseTo(10);
  });

  it("returns undefined without a finite countervalue or for a -100% move", () => {
    expect(countervalueChangeFromDayPercent(undefined, 1)).toBeUndefined();
    expect(countervalueChangeFromDayPercent(Number.NaN, 1)).toBeUndefined();
    expect(countervalueChangeFromDayPercent(100, -100)).toBeUndefined();
  });
});
