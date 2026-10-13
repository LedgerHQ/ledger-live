import "../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
} from "../commands/agent-intent/__test-helpers__/agent-intent-mocks";
import { WalletAdapter } from "../wallet";
import { findAccountTokens, findTokensByTicker } from "./token-lookup";

const realFetch = globalThis.fetch;
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

function calToken(overrides: Record<string, unknown> = {}) {
  return { name: "USD Coin", ticker: "USDC", contract_address: USDC, ...overrides };
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

  it("has CAL filter the network, ticker, standard and listing before it applies the limit", async () => {
    expect(await findTokensByTicker("ethereum", "USDC")).toEqual([
      { ticker: "USDC", name: "USD Coin", address: USDC },
    ]);
    expect(requests).toHaveLength(1);
    expect(requests[0].pathname).toEndWith("/v1/tokens");
    expect(Object.fromEntries(requests[0].searchParams)).toMatchObject({
      network: "ethereum",
      ticker: "USDC",
      standard: "erc20",
      delisted: "false",
      limit: "20",
    });
  });

  it("asks for SPL tokens on Solana", async () => {
    await findTokensByTicker("solana", "USDC");

    expect(requests[0].searchParams.get("standard")).toBe("spl");
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

  it("reports a CAL error instead of finding nothing", async () => {
    status = 503;

    await expect(findTokensByTicker("ethereum", "USDC")).rejects.toThrow(
      "CAL answered 503 when looking up the USDC ticker.",
    );
  });
});

describe("findAccountTokens", () => {
  beforeAll(() =>
    activateAgentIntentMocks({
      sessionRead: async () => ({
        accounts: [
          {
            label: "ethereum-1",
            descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0`,
          },
        ],
      }),
    }),
  );
  afterAll(() => deactivateAgentIntentMocks());

  it("keeps only the tokens the account holds a balance of", async () => {
    const balances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue([
      { assetId: "ethereum", balance: "5" },
      { assetId: "ethereum/erc20/usd__coin", balance: "1" },
      { assetId: "ethereum/erc20/pepe", balance: "0" },
    ] as never);
    const tokens = spyOn(getCryptoAssetsStore(), "findTokenById").mockImplementation(
      async id => ({ ticker: "USDC", name: "USD Coin", contractAddress: USDC, id }) as never,
    );

    try {
      expect(await findAccountTokens("ethereum-1")).toEqual([
        { ticker: "USDC", name: "USD Coin", address: USDC },
      ]);
      expect(tokens.mock.calls.map(([id]) => id)).toEqual(["ethereum/erc20/usd__coin"]);
    } finally {
      balances.mockRestore();
      tokens.mockRestore();
    }
  });
});
