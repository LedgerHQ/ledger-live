import { accountFilterOf, effectiveCurrencyIds } from "./manifestCurrencies";

describe("effectiveCurrencyIds", () => {
  it("reads '*' as every currency", () => {
    expect(effectiveCurrencyIds("*")).toEqual(["**"]);
  });

  it("keeps the manifest patterns without a query", () => {
    expect(effectiveCurrencyIds(["bitcoin", "ethereum/**"])).toEqual(["bitcoin", "ethereum/**"]);
  });

  it("narrows the manifest patterns to the query", () => {
    expect(
      effectiveCurrencyIds(
        ["bitcoin", "ethereum/**"],
        ["bitcoin", "solana", "ethereum/erc20/usd__coin", "polygon/erc20/usd__coin"],
      ),
    ).toEqual(["bitcoin", "ethereum/erc20/usd__coin"]);
  });

  it("lets a '*' manifest see the whole query", () => {
    expect(effectiveCurrencyIds("*", ["solana"])).toEqual(["solana"]);
  });
});

describe("accountFilterOf", () => {
  it("allows everything for '**'", () => {
    expect(accountFilterOf(["**"])("anything", "anything")).toBe(true);
  });

  it("allows a listed currency or token", () => {
    const isAllowed = accountFilterOf(["bitcoin", "ethereum/erc20/usd__coin"]);
    expect(isAllowed("bitcoin", "bitcoin")).toBe(true);
    expect(isAllowed("ethereum/erc20/usd__coin", "ethereum")).toBe(true);
    expect(isAllowed("ethereum", "ethereum")).toBe(false);
  });

  it("allows the parent and the tokens of a 'family/**' pattern", () => {
    const isAllowed = accountFilterOf(["ethereum/**"]);
    expect(isAllowed("ethereum", "ethereum")).toBe(true);
    expect(isAllowed("ethereum/erc20/usd__coin", "ethereum")).toBe(true);
    expect(isAllowed("polygon", "polygon")).toBe(false);
  });
});
