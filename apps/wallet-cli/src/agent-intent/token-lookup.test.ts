import "../live-common-setup";
import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { parseV1 } from "../shared/accountDescriptor";
import { WalletAdapter } from "../wallet";
import { BalanceSchema, toTokenInfo, type TokenInfo } from "../wallet/models";
import {
  findAccountTokens,
  findEthereumSwapAssetByContract,
  findTokensByTicker,
} from "./token-lookup";

const realFetch = globalThis.fetch;
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDE = "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3";
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";

const usdc = {
  id: "ethereum/erc20/usd__coin",
  name: "USD Coin",
  ticker: "USDC",
  contract_address: USDC,
};
const usde = { id: "ethereum/erc20/usde", name: "USDe", ticker: "USDe", contract_address: USDE };

const usdcCandidate = { id: usdc.id, ticker: "USDC", name: "USD Coin", address: USDC };

const listedTokens = async (network: "ethereum" | "solana", ticker: string) =>
  (await findTokensByTicker(network, ticker)).tokens;

const otherTokens = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    ...usdc,
    id: `ethereum/erc20/other_${i}`,
    ticker: `OTHER${i}`,
    contract_address: `0x${i.toString(16).padStart(40, "0")}`,
  }));

describe("findTokensByTicker", () => {
  const meth = {
    id: "ethereum/erc20/meth",
    name: "mETH",
    ticker: "mETH",
    contract_address: "0xd5f7838f5c461feff7fe49ea5ebaf7728bb0adfa",
  };
  const farmingBad = {
    id: "ethereum/erc20/farming_bad",
    name: "Farming Bad",
    ticker: "METH",
    contract_address: "0x11003e410ca3fcd220765b3d2f343433a0b2bffd",
  };
  const methCandidate = {
    id: meth.id,
    ticker: "mETH",
    name: "mETH",
    address: meth.contract_address,
  };
  const farmingBadCandidate = {
    id: farmingBad.id,
    ticker: "METH",
    name: "Farming Bad",
    address: farmingBad.contract_address,
  };

  let requests: URL[];
  let listed: Array<Record<string, unknown>>;
  let respond: ((url: URL) => Response) | undefined;

  // Like CAL: `ticker` matches case-sensitively, `search` any part of a name or ticker in any case.
  function calAnswer(url: URL): Response {
    const search = url.searchParams.get("search")?.toLowerCase();
    if (search === undefined) {
      return Response.json(listed.filter(token => token.ticker === url.searchParams.get("ticker")));
    }
    return Response.json(
      listed.filter(token =>
        [token.name, token.ticker].some(label => String(label).toLowerCase().includes(search)),
      ),
    );
  }

  const lookups = () =>
    requests.map(url =>
      [...url.searchParams].find(([key]) => key === "ticker" || key === "search"),
    );

  beforeEach(() => {
    requests = [];
    listed = [usdc, usde];
    respond = undefined;
    globalThis.fetch = (async (input: URL) => {
      requests.push(input);
      return (respond ?? calAnswer)(input);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("has CAL filter the network, ticker, standard and listing before it applies the limit", async () => {
    expect(await findTokensByTicker("ethereum", "USDC")).toEqual({
      tokens: [usdcCandidate],
      complete: true,
    });
    expect(
      requests.map(url => [url.pathname.endsWith("/v1/tokens"), url.searchParams.toString()]),
    ).toEqual([
      [
        true,
        "network=ethereum&ticker=USDC&standard=erc20&delisted=false&output=id%2Cname%2Cticker%2Ccontract_address&limit=20",
      ],
      [
        true,
        "network=ethereum&search=USDC&standard=erc20&delisted=false&output=id%2Cname%2Cticker%2Ccontract_address&limit=1000",
      ],
    ]);
  });

  it("asks for SPL tokens on Solana", async () => {
    await findTokensByTicker("solana", "USDC");

    expect(requests.map(url => url.searchParams.get("standard"))).toEqual(["spl", "spl"]);
  });

  it("looks a lowercase ticker up as typed and uppercase, and searches for it", async () => {
    expect(await listedTokens("ethereum", "usdc")).toEqual([usdcCandidate]);
    expect(lookups()).toEqual([
      ["ticker", "usdc"],
      ["ticker", "USDC"],
      ["search", "usdc"],
    ]);
  });

  it("still finds the ticker as typed and uppercase when CAL's search leaves it out", async () => {
    respond = url => (url.searchParams.has("search") ? Response.json([]) : calAnswer(url));

    expect(await listedTokens("ethereum", "usdc")).toEqual([usdcCandidate]);
  });

  it("finds the ticker as typed and uppercase when CAL's search fails, saying the list may be incomplete", async () => {
    respond = url =>
      url.searchParams.has("search") ? new Response("", { status: 503 }) : calAnswer(url);

    expect(await findTokensByTicker("ethereum", "usdc")).toEqual({
      tokens: [usdcCandidate],
      complete: false,
    });
  });

  it("says the list may be incomplete when CAL's search returns as many tokens as it asked for", async () => {
    respond = url =>
      url.searchParams.has("search") ? Response.json(otherTokens(1000)) : calAnswer(url);

    expect(await findTokensByTicker("ethereum", "USDC")).toEqual({
      tokens: [usdcCandidate],
      complete: false,
    });
  });

  it("says the list may be incomplete when a ticker lookup returns as many tokens as it asked for", async () => {
    const usdcCopies = otherTokens(20).map(token => ({ ...token, ticker: "USDC" }));
    respond = url =>
      url.searchParams.has("search") ? Response.json([]) : Response.json(usdcCopies);

    const { tokens, complete } = await findTokensByTicker("ethereum", "USDC");

    expect(tokens).toHaveLength(20);
    expect(complete).toBe(false);
  });

  it.each(["usde", "USDE"])(
    "finds a mixed-case ticker typed as %p through CAL's search",
    async ticker => {
      expect(await listedTokens("ethereum", ticker)).toEqual([
        { id: usde.id, ticker: "USDe", name: "USDe", address: USDE },
      ]);
    },
  );

  it("takes a mixed-case ticker spelled as typed over one that matches only in another case", async () => {
    listed = [meth, farmingBad];

    expect(await listedTokens("ethereum", "mETH")).toEqual([methCandidate]);
  });

  it.each(["METH", "meth"])(
    "finds mETH next to the token listed as METH for %p, which CAL's ticker filter misses",
    async ticker => {
      listed = [meth, farmingBad];

      expect(await listedTokens("ethereum", ticker)).toEqual([farmingBadCandidate, methCandidate]);
    },
  );

  it("never prefers a lowercase namesake spelled as typed over the uppercase token", async () => {
    const usdcNamesake = {
      id: "ethereum/erc20/usdc_namesake",
      name: "usdc",
      ticker: "usdc",
      contract_address: "0x0000000000000000000000000000000000000001",
    };
    const namesakeCandidate = {
      id: usdcNamesake.id,
      ticker: "usdc",
      name: "usdc",
      address: usdcNamesake.contract_address,
    };
    listed = [usdc, usdcNamesake];

    expect(await listedTokens("ethereum", "usdc")).toEqual([namesakeCandidate, usdcCandidate]);
    expect(await listedTokens("ethereum", "USDC")).toEqual([usdcCandidate, namesakeCandidate]);
  });

  it("doesn't send CAL a blank search, which it refuses", async () => {
    expect(await listedTokens("ethereum", " ")).toEqual([]);
    expect(lookups()).toEqual([["ticker", " "]]);
  });

  it("keeps one entry for a token both spellings return, and drops other tickers", async () => {
    respond = () => Response.json([usdc, { ...usdc, ticker: "USDC.e", contract_address: "0x2" }]);

    expect(await listedTokens("ethereum", "usdc")).toEqual([usdcCandidate]);
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

describe("findEthereumSwapAssetByContract", () => {
  const usdcToken = {
    id: usdc.id,
    ticker: "USDC",
    tokenType: "erc20",
    parentCurrencyId: "ethereum",
    contractAddress: USDC,
    units: [{ magnitude: 6 }],
  };

  it("resolves an ERC-20 contract on Ethereum mainnet to its swap asset", async () => {
    const store = getCryptoAssetsStore();
    const byAddress = spyOn(store, "findTokenByAddressInCurrency").mockResolvedValue(
      usdcToken as never,
    );
    const byId = spyOn(store, "findTokenById").mockResolvedValue(usdcToken as never);

    try {
      expect(await findEthereumSwapAssetByContract(USDC)).toEqual({
        id: usdc.id,
        ticker: "USDC",
        decimals: 6,
        contract: USDC,
      });
      expect(byAddress).toHaveBeenCalledWith(USDC, "ethereum");
    } finally {
      byAddress.mockRestore();
      byId.mockRestore();
    }
  });

  it("finds nothing for a contract CAL doesn't know on Ethereum mainnet", async () => {
    const byAddress = spyOn(
      getCryptoAssetsStore(),
      "findTokenByAddressInCurrency",
    ).mockResolvedValue(undefined);

    try {
      expect(await findEthereumSwapAssetByContract(USDC)).toBeNull();
    } finally {
      byAddress.mockRestore();
    }
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
    const heldUsdc = erc20("USDC", "USD Coin", USDC);
    const balances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue({
      balances: [
        BalanceSchema.parse({ kind: "native", assetId: "ethereum", balance: "5" }),
        tokenBalance("1", heldUsdc),
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
      expect(tokens).toEqual([
        { id: heldUsdc.id, ticker: "USDC", name: "USD Coin", address: USDC },
      ]);
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
