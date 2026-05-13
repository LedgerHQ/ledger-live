import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  formatAmount,
  formatCreatedAt,
  formatFeesAmount,
  getExplorerUrl,
  resolveAccountLike,
  truncateMiddle,
} from "../utils";

jest.mock("@ledgerhq/live-common/explorers", () => ({
  getDefaultExplorerView: jest.fn(currency => ({ currencyId: currency.id })),
  getTransactionExplorer: jest.fn((_explorerView, operationHash) => {
    return `https://explorer.test/tx/${operationHash}`;
  }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const polygon = getCryptoCurrencyById("polygon");
const ton = getCryptoCurrencyById("ton");
const usdcPolygon: TokenCurrency = {
  type: "TokenCurrency",
  id: "polygon/erc20/usd_coin",
  parentCurrencyId: polygon.id,
  tokenType: "erc20",
  contractAddress: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  ticker: "USDC",
  name: "USD Coin",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
};

function normalizeSpaces(value: string | undefined): string | undefined {
  return value?.replace(/\u00a0/g, " ");
}

describe("resolveAccountLike", () => {
  it("should resolve a parent account directly", () => {
    const account = genAccount("bitcoin-account", { currency: bitcoin });

    expect(resolveAccountLike([account], account.id)).toEqual({ account });
  });

  it("should resolve token accounts with their parent account", () => {
    const parentAccount = genAccount("polygon-account", { currency: polygon });
    const tokenAccount = genTokenAccount(0, parentAccount, usdcPolygon);

    expect(resolveAccountLike([parentAccount, tokenAccount], tokenAccount.id)).toEqual({
      account: tokenAccount,
      parentAccount,
    });
  });

  it("should return undefined when the account cannot be resolved", () => {
    expect(resolveAccountLike([], "missing-account")).toBeUndefined();
    expect(resolveAccountLike([], undefined)).toBeUndefined();
  });
});

describe("amount formatting", () => {
  it("should format raw atomic amounts with at most eight displayed decimals", () => {
    expect(normalizeSpaces(formatAmount(ethereum, "123456789123456789", "en-US"))).toBe(
      "0.12345678 ETH",
    );
  });

  it("should format fees from the resolved main account currency", () => {
    const account = genAccount("bitcoin-account", { currency: bitcoin });

    expect(normalizeSpaces(formatFeesAmount({ account }, "123456789", "en-US"))).toBe(
      "1.23456789 BTC",
    );
  });

  it("should return undefined when amount inputs are missing", () => {
    expect(formatAmount(undefined, "123", "en-US")).toBeUndefined();
    expect(formatAmount(bitcoin, undefined, "en-US")).toBeUndefined();
    expect(formatFeesAmount(undefined, "123", "en-US")).toBeUndefined();
  });
});

describe("date and identifier formatting", () => {
  it("should format creation dates with the requested locale", () => {
    const createdAt = new Date(2024, 0, 2, 15, 4).getTime();

    expect(formatCreatedAt(createdAt, "en-US")).toBe(
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(createdAt)),
    );
  });

  it("should truncate long identifiers without changing short identifiers", () => {
    expect(truncateMiddle("1234567890abcdef")).toBe("12345678…abcdef");
    expect(truncateMiddle("swap-1")).toBe("swap-1");
  });
});

describe("getExplorerUrl", () => {
  it.each([
    ["lifi", "https://scan.li.fi/tx/hash-1"],
    ["thorswap", "https://runescan.io/tx/hash-1"],
    ["nearintents", "https://track.swapkit.dev/tx/hash-1"],
  ])("should return the provider operation explorer URL for %s", (provider, expectedUrl) => {
    expect(
      getExplorerUrl({
        provider,
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: bitcoin,
      }),
    ).toBe(expectedUrl);
  });

  it.each(["swapsxyz", "moonpay_trade"])(
    "should return the Swaps.xyz scan URL for %s without requiring an operation hash",
    provider => {
      expect(
        getExplorerUrl({
          provider,
          swapId: "swap-1",
          operationHash: undefined,
          fromCurrency: undefined,
        }),
      ).toBe("https://scan.swaps.xyz/transactions/swap-1");
    },
  );

  it("should return the OKX explorer URL for the parent currency of a token swap", () => {
    expect(
      getExplorerUrl({
        provider: "okx",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: usdcPolygon,
      }),
    ).toBe("https://web3.okx.com/fi/explorer/polygon/tx/hash-1");
  });

  it("should return undefined for OKX when the currency is missing", () => {
    expect(
      getExplorerUrl({
        provider: "okx",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: undefined,
      }),
    ).toBeUndefined();
  });

  it("should fall back to the currency transaction explorer for unknown providers", () => {
    expect(
      getExplorerUrl({
        provider: "custom-provider",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: bitcoin,
      }),
    ).toBe("https://explorer.test/tx/hash-1");
  });

  it("should use the family transaction explorer override for unknown TON providers", () => {
    expect(
      getExplorerUrl({
        provider: "changelly_v2",
        swapId: "swap-1",
        operationHash: "ton-hash-1",
        fromCurrency: ton,
        getTransactionExplorer: (_explorerView, operation) =>
          `https://tonviewer.com/transaction/by-msg-hash/${operation.hash}`,
      }),
    ).toBe("https://tonviewer.com/transaction/by-msg-hash/ton-hash-1");
  });

  it("should not build provider hash URLs when the operation hash is missing", () => {
    expect(
      getExplorerUrl({
        provider: "lifi",
        swapId: "swap-1",
        operationHash: undefined,
        fromCurrency: undefined,
      }),
    ).toBeUndefined();
  });

  it("should return undefined when provider data is missing", () => {
    expect(
      getExplorerUrl({
        provider: undefined,
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: bitcoin,
      }),
    ).toBeUndefined();
  });
});
