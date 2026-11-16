import "../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { parseV1 } from "../shared/accountDescriptor";
import { WalletAdapter } from "../wallet";
import { BalanceSchema, toTokenInfo, type TokenInfo } from "../wallet/models";
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

const erc20 = (ticker: string, name: string, contractAddress: string): TokenInfo =>
  toTokenInfo({
    type: "TokenCurrency",
    id: TokenCurrencyIdSchema.parse(`ethereum/erc20/${contractAddress}`),
    ticker,
    name,
    contractAddress,
    parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
    tokenType: "erc20",
    units: [{ name, code: ticker, magnitude: 6 }],
  });

const tokenBalance = (balance: string, token: TokenInfo) =>
  BalanceSchema.parse({ kind: "token", assetId: token.id, balance, token });

describe("findAccountTokens", () => {
  const account = parseV1(`account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0`);

  it("keeps only listed tokens the account holds a balance of, without a CAL lookup per token", async () => {
    const balances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue({
      balances: [
        BalanceSchema.parse({ kind: "native", assetId: "ethereum", balance: "5" }),
        tokenBalance("1", erc20("USDC", "USD Coin", USDC)),
        tokenBalance("0", erc20("PEPE", "Pepe", "0x2")),
        tokenBalance("1", { ...erc20("USDC", "Old USDC", "0x1"), delisted: true }),
      ],
      skippedTokenIds: [],
    });
    const store = getCryptoAssetsStore();
    const calLookups = [
      spyOn(store, "findTokenById").mockResolvedValue(undefined),
      spyOn(store, "findTokenByAddressInCurrency").mockResolvedValue(undefined),
    ];

    try {
      const { tokens } = await findAccountTokens(account);

      expect(calLookups.flatMap(lookup => lookup.mock.calls)).toEqual([]);
      expect(tokens).toEqual([{ ticker: "USDC", name: "USD Coin", address: USDC }]);
      expect(balances).toHaveBeenCalledTimes(1);
      expect(balances).toHaveBeenCalledWith(expect.objectContaining({ currencyId: "ethereum" }));
    } finally {
      balances.mockRestore();
      calLookups.forEach(lookup => lookup.mockRestore());
    }
  });

  it("passes on the ids of the tokens the wallet skipped", async () => {
    const balances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue({
      balances: [BalanceSchema.parse({ kind: "native", assetId: "ethereum", balance: "5" })],
      skippedTokenIds: ["ethereum/erc20/no_units"],
    });

    try {
      expect(await findAccountTokens(account)).toEqual({
        tokens: [],
        skippedTokenIds: ["ethereum/erc20/no_units"],
      });
    } finally {
      balances.mockRestore();
    }
  });
});
