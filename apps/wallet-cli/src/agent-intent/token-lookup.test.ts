import "../live-common-setup";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { findTokensByTicker } from "./token-lookup";

const realFetch = globalThis.fetch;

function calToken(overrides: Record<string, unknown> = {}) {
  return {
    name: "USD Coin",
    ticker: "USDC",
    contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    standard: "erc20",
    delisted: false,
    ...overrides,
  };
}

describe("findTokensByTicker", () => {
  let requests: URL[];
  let tokensFor: (ticker: string) => unknown[];
  let status: number;

  beforeEach(() => {
    requests = [];
    status = 200;
    tokensFor = () => [calToken()];
    globalThis.fetch = (async (input: URL) => {
      requests.push(input);
      const ticker = input.searchParams.get("ticker") ?? "";
      return new Response(JSON.stringify(tokensFor(ticker)), { status });
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("asks CAL for the ticker's tokens on the network's mainnet", async () => {
    expect(await findTokensByTicker("ethereum", "USDC")).toEqual([
      { ticker: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    ]);
    expect(requests).toHaveLength(1);
    expect(requests[0].pathname).toEndWith("/v1/tokens");
    expect(requests[0].searchParams.get("network")).toBe("ethereum");
    expect(requests[0].searchParams.get("ticker")).toBe("USDC");
  });

  it("also looks up the uppercase spelling, since CAL matches tickers case-sensitively", async () => {
    tokensFor = ticker => (ticker === "USDC" ? [calToken()] : []);

    expect(await findTokensByTicker("ethereum", "usdc")).toHaveLength(1);
    expect(requests.map(url => url.searchParams.get("ticker"))).toEqual(["usdc", "USDC"]);
  });

  it("keeps one entry for a token both spellings return", async () => {
    tokensFor = () => [calToken({ ticker: "stETH", contract_address: "0xae7a" })];

    expect(await findTokensByTicker("ethereum", "stETH")).toHaveLength(1);
  });

  it("drops delisted tokens and other token standards", async () => {
    tokensFor = () => [
      calToken({ delisted: true }),
      calToken({ standard: "erc721", contract_address: "0x2" }),
      calToken({ contract_address: "0x3" }),
    ];

    expect((await findTokensByTicker("ethereum", "USDC")).map(token => token.address)).toEqual([
      "0x3",
    ]);
  });

  it("takes SPL tokens on Solana", async () => {
    tokensFor = () => [calToken({ standard: "spl", contract_address: "EPjF" })];

    expect((await findTokensByTicker("solana", "USDC")).map(token => token.address)).toEqual([
      "EPjF",
    ]);
  });

  it("reports a CAL error instead of finding nothing", async () => {
    status = 503;

    await expect(findTokensByTicker("ethereum", "USDC")).rejects.toThrow(
      "CAL answered 503 when looking up the USDC ticker.",
    );
  });
});
