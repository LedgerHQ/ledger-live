import {
  getChangePercentage,
  isAvailableForTrading,
  filterMarketPerformersByAvailability,
  IsCurrencyAvailable,
} from "../index";
import { createMockMarketPerformer, MOCK_MARKET_PERFORMERS } from "../fixtures";

describe("getChangePercentage", () => {
  const mockData = createMockMarketPerformer({
    priceChangePercentage24h: 5.5,
    priceChangePercentage7d: 10.2,
    priceChangePercentage30d: 15.3,
    priceChangePercentage1y: 120.5,
  });

  it("should return 24h change for 'day' range", () => {
    expect(getChangePercentage(mockData, "day")).toBe(5.5);
  });

  it("should return 7d change for 'week' range", () => {
    expect(getChangePercentage(mockData, "week")).toBe(10.2);
  });

  it("should return 30d change for 'month' range", () => {
    expect(getChangePercentage(mockData, "month")).toBe(15.3);
  });

  it("should return 1y change for 'year' range", () => {
    expect(getChangePercentage(mockData, "year")).toBe(120.5);
  });

  it("should return 1y change for 'all' range", () => {
    expect(getChangePercentage(mockData, "all")).toBe(120.5);
  });

  it("should return 0 when percentage is null", () => {
    const dataWithNull = { ...createMockMarketPerformer(), priceChangePercentage24h: null };
    // @ts-expect-error testing null value handling
    expect(getChangePercentage(dataWithNull, "day")).toBe(0);
  });

  it("should return 0 when percentage is undefined", () => {
    const dataWithUndefined = {
      ...createMockMarketPerformer(),
      priceChangePercentage24h: undefined,
    };
    // @ts-expect-error testing undefined value handling
    expect(getChangePercentage(dataWithUndefined, "day")).toBe(0);
  });
});

describe("isAvailableForTrading", () => {
  const createIsCurrencyAvailable =
    (availableCurrencies: Record<string, string[]>): IsCurrencyAvailable =>
    (currencyId: string, mode: "onRamp" | "offRamp") =>
      availableCurrencies[mode]?.includes(currencyId) ?? false;

  it("should return true if currency is available for buy (onRamp)", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["bitcoin"],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    expect(isAvailableForTrading("bitcoin", [], isCurrencyAvailable, swapSet)).toBe(true);
  });

  it("should return true if currency is available for swap", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: [],
      offRamp: [],
    });
    const swapSet = new Set<string>(["bitcoin"]);

    expect(isAvailableForTrading("bitcoin", [], isCurrencyAvailable, swapSet)).toBe(true);
  });

  it("should return true if ledgerId is available for buy", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["bitcoin-ledger"],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    expect(isAvailableForTrading("bitcoin", ["bitcoin-ledger"], isCurrencyAvailable, swapSet)).toBe(
      true,
    );
  });

  it("should return true if ledgerId is available for swap", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: [],
      offRamp: [],
    });
    const swapSet = new Set<string>(["bitcoin-ledger"]);

    expect(isAvailableForTrading("bitcoin", ["bitcoin-ledger"], isCurrencyAvailable, swapSet)).toBe(
      true,
    );
  });

  it("should return false if currency is not available anywhere", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["ethereum"],
      offRamp: ["ethereum"],
    });
    const swapSet = new Set<string>(["ethereum"]);

    expect(isAvailableForTrading("bitcoin", [], isCurrencyAvailable, swapSet)).toBe(false);
  });

  it("should return false if only offRamp is available (not considered)", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: [],
      offRamp: ["bitcoin"],
    });
    const swapSet = new Set<string>();

    expect(isAvailableForTrading("bitcoin", [], isCurrencyAvailable, swapSet)).toBe(false);
  });
});

describe("filterMarketPerformersByAvailability", () => {
  const createIsCurrencyAvailable =
    (availableCurrencies: Record<string, string[]>): IsCurrencyAvailable =>
    (currencyId: string, mode: "onRamp" | "offRamp") =>
      availableCurrencies[mode]?.includes(currencyId) ?? false;

  // Use first 4 performers from shared fixtures
  const mockPerformers = [
    ...MOCK_MARKET_PERFORMERS.slice(0, 3),
    createMockMarketPerformer({ id: "unavailable", name: "Unavailable" }),
  ];

  it("should filter currencies available for buy", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["bitcoin", "ethereum"],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    const result = filterMarketPerformersByAvailability(
      mockPerformers,
      isCurrencyAvailable,
      swapSet,
      10,
    );

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(["bitcoin", "ethereum"]);
  });

  it("should filter currencies available for swap", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: [],
      offRamp: [],
    });
    const swapSet = new Set<string>(["bitcoin", "solana"]);

    const result = filterMarketPerformersByAvailability(
      mockPerformers,
      isCurrencyAvailable,
      swapSet,
      10,
    );

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(["bitcoin", "solana"]);
  });

  it("should filter currencies available for buy OR swap", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["bitcoin"],
      offRamp: [],
    });
    const swapSet = new Set<string>(["solana"]);

    const result = filterMarketPerformersByAvailability(
      mockPerformers,
      isCurrencyAvailable,
      swapSet,
      10,
    );

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(["bitcoin", "solana"]);
  });

  it("should respect the limit parameter", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["bitcoin", "ethereum", "solana"],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    const result = filterMarketPerformersByAvailability(
      mockPerformers,
      isCurrencyAvailable,
      swapSet,
      2,
    );

    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual(["bitcoin", "ethereum"]);
  });

  it("should fallback to original list when no currencies are available", () => {
    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: [],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    const result = filterMarketPerformersByAvailability(
      mockPerformers,
      isCurrencyAvailable,
      swapSet,
      3,
    );

    expect(result).toHaveLength(3);
    expect(result.map(r => r.id)).toEqual(["bitcoin", "ethereum", "solana"]);
  });

  it("should filter by ledgerIds availability", () => {
    const performers = [
      createMockMarketPerformer({ id: "bitcoin", name: "Bitcoin", ledgerIds: ["btc-ledger"] }),
      createMockMarketPerformer({ id: "ethereum", name: "Ethereum", ledgerIds: [] }),
    ];

    const isCurrencyAvailable = createIsCurrencyAvailable({
      onRamp: ["btc-ledger"],
      offRamp: [],
    });
    const swapSet = new Set<string>();

    const result = filterMarketPerformersByAvailability(
      performers,
      isCurrencyAvailable,
      swapSet,
      10,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("bitcoin");
  });
});
