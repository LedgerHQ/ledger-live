import type { AccountLike } from "@ledgerhq/types-live";

import { setWalletApiIdForAccountId, getWalletApiIdFromAccountId } from "../../../converters";
import type { NetworkFeeContext } from "./networkFeeEstimate";
import type { GetQuotesArgs } from "../types";
import { buildFormatContext } from "./buildFormatContext";

/**
 * Register a realistic `(realAccountId → walletApiId)` pair and return
 * the wallet-api-shaped id to put into `QuotesInput`. The converter
 * module's uuid table is process-global, but each test id is unique so
 * cross-test leakage is not a concern here.
 */
function registerWalletApiAccount(realId: string): string {
  setWalletApiIdForAccountId(realId);
  return getWalletApiIdFromAccountId(realId);
}

/**
 * Build just enough of an `AccountLike` for `buildFormatContext` to
 * extract currency metadata. We only read `id`, `type`, `currency` (or
 * `token`), and `units[0].magnitude / ticker`, so a partial cast is
 * safer than importing full account factories for this unit test.
 */
function makeCryptoAccount(
  id: string,
  currencyId: string,
  ticker: string,
  magnitude: number,
): AccountLike {
  return {
    type: "Account",
    id,
    currency: {
      id: currencyId,
      ticker,
      units: [{ code: ticker, name: ticker, magnitude }],
    },
  } as unknown as AccountLike;
}

function makeTokenAccount(
  id: string,
  tokenId: string,
  ticker: string,
  magnitude: number,
): AccountLike {
  return {
    type: "TokenAccount",
    id,
    token: {
      id: tokenId,
      ticker,
      units: [{ code: ticker, name: ticker, magnitude }],
    },
  } as unknown as AccountLike;
}

function makeArgs(overrides: Partial<GetQuotesArgs["data"]> = {}): GetQuotesArgs {
  return {
    providers: ["lifi"],
    data: {
      amount: "1",
      sendAccountId: "send-wallet-api-id",
      receiveAccountId: "receive-wallet-api-id",
      sendAddress: "0xsend",
      receiveAddress: "0xreceive",
      sendCurrencyId: "ethereum",
      receiveCurrencyId: "ethereum/erc20/usd__coin",
      ...overrides,
    },
  };
}

const ethFeeContext: NetworkFeeContext = {
  estimatedFeesAtomic: { toFixed: () => "0" } as never,
  balanceAtomic: { toFixed: () => "0" } as never,
  feeCurrencyId: "ethereum",
  feeCurrencyMagnitude: 18,
  mainAccountCurrencyId: "ethereum",
};

describe("buildFormatContext", () => {
  it("returns undefined when locale is missing (legacy handler callers)", () => {
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: ethFeeContext,
      counterValueCurrency: "USD",
    });
    expect(ctx).toBeUndefined();
  });

  it("returns undefined when counterValueCurrency is missing", () => {
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: ethFeeContext,
      locale: "en",
    });
    expect(ctx).toBeUndefined();
  });

  it("returns undefined when the counter-value ticker does not resolve to a known fiat", () => {
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: ethFeeContext,
      locale: "en",
      counterValueCurrency: "NOTAFIAT",
    });
    expect(ctx).toBeUndefined();
  });

  it("uppercases the counter-value ticker before looking up fiat metadata", () => {
    // Exercise the `toUpperCase()` normalization branch: "usd" from wallet
    // state still resolves to the USD fiat entry without the caller having
    // to pre-uppercase.
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: ethFeeContext,
      locale: "en",
      counterValueCurrency: "usd",
    });
    expect(ctx?.fiat.ticker).toBe("USD");
  });

  it("resolves send / receive / fee currency metadata from the wallet accounts list", () => {
    const sendWalletId = registerWalletApiAccount("sendRealId-eth");
    const receiveWalletId = registerWalletApiAccount("receiveRealId-usdc");

    const accounts: AccountLike[] = [
      makeCryptoAccount("sendRealId-eth", "ethereum", "ETH", 18),
      makeTokenAccount("receiveRealId-usdc", "ethereum/erc20/usd__coin", "USDC", 6),
    ];

    const ctx = buildFormatContext({
      args: makeArgs({ sendAccountId: sendWalletId, receiveAccountId: receiveWalletId }),
      accounts,
      spotPrices: { ethereum: 3000 },
      feeContext: ethFeeContext,
      locale: "en",
      counterValueCurrency: "USD",
    });

    expect(ctx).toEqual({
      locale: "en",
      fiat: { ticker: "USD", symbol: "$", magnitude: 2 },
      spotPrices: { ethereum: 3000 },
      sendCurrency: { id: "ethereum", decimals: 18, ticker: "ETH" },
      receiveCurrency: {
        id: "ethereum/erc20/usd__coin",
        decimals: 6,
        ticker: "USDC",
      },
      networkFeesCurrency: { id: "ethereum", decimals: 18, ticker: "ETH" },
    });
  });

  it("leaves sendCurrency / receiveCurrency undefined when accounts are missing (format still works — keeps partial formatting)", () => {
    const ctx = buildFormatContext({
      args: makeArgs({
        sendAccountId: "unknown-send",
        receiveAccountId: "unknown-receive",
      }),
      accounts: [],
      spotPrices: {},
      feeContext: ethFeeContext,
      locale: "en",
      counterValueCurrency: "USD",
    });
    expect(ctx?.sendCurrency).toBeUndefined();
    expect(ctx?.receiveCurrency).toBeUndefined();
    // Fee currency still resolves because it is derived from feeContext, not from accounts.
    expect(ctx?.networkFeesCurrency).toEqual({
      id: "ethereum",
      decimals: 18,
      ticker: "ETH",
    });
  });

  it("leaves networkFeesCurrency undefined when feeContext is null (bridge failure)", () => {
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: null,
      locale: "en",
      counterValueCurrency: "USD",
    });
    expect(ctx?.networkFeesCurrency).toBeUndefined();
  });

  it("leaves networkFeesCurrency undefined when feeCurrencyId does not resolve to a known crypto (unreachable in prod, guards against CAL drift)", () => {
    const ctx = buildFormatContext({
      args: makeArgs(),
      accounts: [],
      spotPrices: {},
      feeContext: { ...ethFeeContext, feeCurrencyId: "not-a-real-currency" },
      locale: "en",
      counterValueCurrency: "USD",
    });
    expect(ctx?.networkFeesCurrency).toBeUndefined();
  });
});
