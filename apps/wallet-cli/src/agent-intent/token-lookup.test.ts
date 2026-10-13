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
const USDE = "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3";
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

const usdc = { name: "USD Coin", ticker: "USDC", contract_address: USDC };
const usde = { name: "USDe", ticker: "USDe", contract_address: USDE };

describe("findTokensByTicker", () => {
  let requests: URL[];
  let listed: Array<Record<string, unknown>>;
  let respond: ((url: URL) => Response) | undefined;

  beforeEach(() => {
    requests = [];
    listed = [usdc, usde];
    respond = undefined;
    // Like CAL: the `ticker` filter is case-sensitive.
    globalThis.fetch = (async (input: URL) => {
      requests.push(input);
      if (respond) return respond(input);
      const ticker = input.searchParams.get("ticker");
      return Response.json(listed.filter(token => token.ticker === ticker));
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("has CAL filter the network, ticker, standard and listing before it applies the limit", async () => {
    expect(await findTokensByTicker("ethereum", "USDC")).toEqual([
      { ticker: "USDC", name: "USD Coin", address: USDC },
    ]);
    expect(
      requests.map(url => [url.pathname.endsWith("/v1/tokens"), url.searchParams.toString()]),
    ).toEqual([
      [
        true,
        "network=ethereum&ticker=USDC&standard=erc20&delisted=false&output=name%2Cticker%2Ccontract_address&limit=20",
      ],
    ]);
  });

  it("asks for SPL tokens on Solana", async () => {
    await findTokensByTicker("solana", "USDC");

    expect(requests.map(url => url.searchParams.get("standard"))).toEqual(["spl"]);
  });

  it("finds a lowercase ticker under its uppercase spelling", async () => {
    expect(await findTokensByTicker("ethereum", "usdc")).toEqual([
      { ticker: "USDC", name: "USD Coin", address: USDC },
    ]);
    expect(requests.map(url => url.searchParams.get("ticker"))).toEqual(["usdc", "USDC"]);
  });

  it("finds a mixed-case ticker only as CAL spells it", async () => {
    expect(await findTokensByTicker("ethereum", "usde")).toEqual([]);
    expect(await findTokensByTicker("ethereum", "USDe")).toEqual([
      { ticker: "USDe", name: "USDe", address: USDE },
    ]);
  });

  it("keeps one entry for a token both spellings return, and drops other tickers", async () => {
    respond = () => Response.json([usdc, { ...usdc, ticker: "USDC.e", contract_address: "0x2" }]);

    expect(await findTokensByTicker("ethereum", "usdc")).toEqual([
      { ticker: "USDC", name: "USD Coin", address: USDC },
    ]);
  });

  it.each([
    [() => new Response("", { status: 503 }), "CAL answered 503 when looking up the USDC ticker."],
    [
      () => Response.json([{ ticker: "USDC" }]),
      "CAL sent an unexpected response when looking up the USDC ticker.",
    ],
    [
      () => new Response("<html>"),
      "CAL sent an unexpected response when looking up the USDC ticker.",
    ],
    [
      (): Response => {
        throw new TypeError("fetch failed");
      },
      "CAL didn't answer the USDC ticker lookup: fetch failed",
    ],
  ])("reports a CAL failure instead of finding nothing (%#)", async (response, message) => {
    respond = response;

    await expect(findTokensByTicker("ethereum", "USDC")).rejects.toThrow(message);
  });
});

describe("findAccountTokens", () => {
  beforeAll(() =>
    activateAgentIntentMocks({
      sessionRead: async () => ({
        accounts: [
          {
            label: "ethereum-1",
            descriptor: `account:1:address:ethereum:main:${SENDER}:m/44h/60h/0h/0/0`,
          },
        ],
      }),
    }),
  );
  afterAll(() => deactivateAgentIntentMocks());

  it("keeps only listed tokens the account holds a balance of", async () => {
    const balances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue([
      { assetId: "ethereum", balance: "5" },
      { assetId: "ethereum/erc20/usd__coin", balance: "1" },
      { assetId: "ethereum/erc20/pepe", balance: "0" },
      { assetId: "ethereum/erc20/delisted", balance: "1" },
      { assetId: "ethereum/erc20/unknown", balance: "1" },
    ] as never);
    const tokens = spyOn(getCryptoAssetsStore(), "findTokenById").mockImplementation(
      async id =>
        ({
          "ethereum/erc20/usd__coin": { ticker: "USDC", name: "USD Coin", contractAddress: USDC },
          "ethereum/erc20/delisted": {
            ticker: "USDC",
            name: "Old USDC",
            contractAddress: "0x1",
            delisted: true,
          },
        })[id] as never,
    );

    try {
      expect(await findAccountTokens("ethereum-1")).toEqual([
        { ticker: "USDC", name: "USD Coin", address: USDC },
      ]);
      expect(tokens.mock.calls.map(([id]) => id)).toEqual([
        "ethereum/erc20/usd__coin",
        "ethereum/erc20/delisted",
        "ethereum/erc20/unknown",
      ]);
    } finally {
      balances.mockRestore();
      tokens.mockRestore();
    }
  });
});
