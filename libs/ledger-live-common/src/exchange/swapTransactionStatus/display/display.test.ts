import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "../../../currencies/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  formatSwapTransactionStatusAmount,
  formatSwapTransactionStatusCreatedAt,
  formatSwapTransactionStatusFeesAmount,
  getSwapTransactionStatusDisplayStatus,
  getSwapTransactionStatusDetailsViewModel,
  getSwapTransactionStatusExplorerUrl,
  getSwapTransactionStatusLabelKey,
  getSwapTransactionStatusReceiveDisplayStatus,
  getSwapTransactionStatusSectionItems,
  getSwapTransactionStatusTitleKey,
  getSwapTransactionStatusVisualTokens,
  resolveSwapTransactionStatusAccountLike,
  truncateSwapTransactionStatusIdentifier,
} from "./index";

jest.mock("../../../explorers", () => ({
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

describe("resolveSwapTransactionStatusAccountLike", () => {
  it("should resolve a parent account directly", () => {
    const account = genAccount("bitcoin-account", { currency: bitcoin });

    expect(resolveSwapTransactionStatusAccountLike([account], account.id)).toEqual({ account });
  });

  it("should resolve token accounts with their parent account", () => {
    const parentAccount = genAccount("polygon-account", { currency: polygon });
    const tokenAccount = genTokenAccount(0, parentAccount, usdcPolygon);

    expect(
      resolveSwapTransactionStatusAccountLike([parentAccount, tokenAccount], tokenAccount.id),
    ).toEqual({
      account: tokenAccount,
      parentAccount,
    });
  });

  it("should return undefined when the account cannot be resolved", () => {
    expect(resolveSwapTransactionStatusAccountLike([], "missing-account")).toBeUndefined();
    expect(resolveSwapTransactionStatusAccountLike([], undefined)).toBeUndefined();
  });
});

describe("amount formatting", () => {
  it("should format raw atomic amounts with at most eight displayed decimals", () => {
    expect(
      normalizeSpaces(formatSwapTransactionStatusAmount(ethereum, "123456789123456789", "en-US")),
    ).toBe("0.12345678 ETH");
  });

  it("should format fees from the resolved main account currency", () => {
    const account = genAccount("bitcoin-account", { currency: bitcoin });

    expect(
      normalizeSpaces(formatSwapTransactionStatusFeesAmount({ account }, "123456789", "en-US")),
    ).toBe("1.23456789 BTC");
  });

  it("should return undefined when amount inputs are missing", () => {
    expect(formatSwapTransactionStatusAmount(undefined, "123", "en-US")).toBeUndefined();
    expect(formatSwapTransactionStatusAmount(bitcoin, undefined, "en-US")).toBeUndefined();
    expect(formatSwapTransactionStatusFeesAmount(undefined, "123", "en-US")).toBeUndefined();
  });
});

describe("date and identifier formatting", () => {
  it("should format creation dates with the requested locale", () => {
    const createdAt = new Date(2024, 0, 2, 15, 4).getTime();

    expect(formatSwapTransactionStatusCreatedAt(createdAt, "en-US")).toBe(
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
    expect(truncateSwapTransactionStatusIdentifier("1234567890abcdef")).toBe("12345678…abcdef");
    expect(truncateSwapTransactionStatusIdentifier("swap-1")).toBe("swap-1");
  });
});

describe("getSwapTransactionStatusDetailsViewModel", () => {
  it("should resolve provider display metadata and truncate the swap id", () => {
    expect(
      getSwapTransactionStatusDetailsViewModel({
        provider: "changelly",
        providerData: {
          displayName: "Changelly",
          mainUrl: "https://changelly.test",
          needsKYC: false,
          supportUrl: "https://changelly.test/support",
          termsOfUseUrl: "https://changelly.test/terms",
          type: "CEX",
          useInExchangeApp: true,
        },
        swapId: "1234567890abcdef",
      }),
    ).toEqual({
      providerName: "Changelly",
      providerMainUrl: "https://changelly.test",
      shouldShowProvider: true,
      truncatedSwapId: "12345678…abcdef",
    });
  });

  it("should hide the provider row when provider metadata is missing", () => {
    expect(
      getSwapTransactionStatusDetailsViewModel({
        provider: undefined,
        providerData: undefined,
        swapId: "swap-1",
      }),
    ).toEqual({
      providerName: undefined,
      providerMainUrl: undefined,
      shouldShowProvider: false,
      truncatedSwapId: "swap-1",
    });
  });
});

describe("getSwapTransactionStatusExplorerUrl", () => {
  it.each([
    ["lifi", "https://scan.li.fi/tx/hash-1"],
    ["thorswap", "https://runescan.io/tx/hash-1"],
    ["nearintents", "https://track.swapkit.dev/tx/hash-1"],
  ])("should return the provider operation explorer URL for %s", (provider, expectedUrl) => {
    expect(
      getSwapTransactionStatusExplorerUrl({
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
        getSwapTransactionStatusExplorerUrl({
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
      getSwapTransactionStatusExplorerUrl({
        provider: "okx",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: usdcPolygon,
      }),
    ).toBe("https://web3.okx.com/fi/explorer/polygon/tx/hash-1");
  });

  it("should return undefined for OKX when the currency is missing", () => {
    expect(
      getSwapTransactionStatusExplorerUrl({
        provider: "okx",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: undefined,
      }),
    ).toBeUndefined();
  });

  it("should fall back to the currency transaction explorer for unknown providers", () => {
    expect(
      getSwapTransactionStatusExplorerUrl({
        provider: "custom-provider",
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: bitcoin,
      }),
    ).toBe("https://explorer.test/tx/hash-1");
  });

  it("should use the family transaction explorer override for unknown TON providers", () => {
    expect(
      getSwapTransactionStatusExplorerUrl({
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
      getSwapTransactionStatusExplorerUrl({
        provider: "lifi",
        swapId: "swap-1",
        operationHash: undefined,
        fromCurrency: undefined,
      }),
    ).toBeUndefined();
  });

  it("should return undefined when provider data is missing", () => {
    expect(
      getSwapTransactionStatusExplorerUrl({
        provider: undefined,
        swapId: "swap-1",
        operationHash: "hash-1",
        fromCurrency: bitcoin,
      }),
    ).toBeUndefined();
  });
});

describe("status display helpers", () => {
  it("should normalize receive unknown to finished when the swap or send leg is finished", () => {
    expect(getSwapTransactionStatusReceiveDisplayStatus("unknown", "finished", "pending")).toBe(
      "finished",
    );
    expect(getSwapTransactionStatusReceiveDisplayStatus("unknown", "pending", "finished")).toBe(
      "finished",
    );
  });

  it("should keep receive unknown when the swap and send leg are not finished", () => {
    expect(getSwapTransactionStatusReceiveDisplayStatus("unknown", "pending", "pending")).toBe(
      "unknown",
    );
  });

  it.each([
    ["finished", "success"],
    ["expired", "error"],
    ["refunded", "error"],
    ["unknown", "unknown"],
    ["pending", "pending"],
  ] as const)("should map %s to %s display status", (status, displayStatus) => {
    expect(getSwapTransactionStatusDisplayStatus(status)).toBe(displayStatus);
  });

  it("should build status title keys from the given translation prefix", () => {
    expect(
      getSwapTransactionStatusTitleKey("send", "finished", "swap2.modals.transactionStatus"),
    ).toBe("swap2.modals.transactionStatus.sections.status.sendCompleted");
    expect(
      getSwapTransactionStatusTitleKey(
        "receive",
        "pending",
        "transfer.swap2.modals.transactionStatus",
      ),
    ).toBe("transfer.swap2.modals.transactionStatus.sections.status.receivePending");
  });

  it("should build status label keys and use cancelled for refunded receive statuses", () => {
    expect(
      getSwapTransactionStatusLabelKey("send", "refunded", "swap2.modals.transactionStatus"),
    ).toBe("swap2.modals.transactionStatus.statusLabels.refunded");
    expect(
      getSwapTransactionStatusLabelKey(
        "receive",
        "refunded",
        "transfer.swap2.modals.transactionStatus",
      ),
    ).toBe("transfer.swap2.modals.transactionStatus.statusLabels.cancelled");
  });

  it("should build status section items from statuses, tickers, and translation prefix", () => {
    expect(
      getSwapTransactionStatusSectionItems({
        sendStatus: "finished",
        receiveStatus: "refunded",
        sendTicker: "BTC",
        receiveTicker: "ETH",
        translationPrefix: "swap2.modals.transactionStatus",
      }),
    ).toEqual({
      send: {
        displayStatus: "success",
        titleKey: "swap2.modals.transactionStatus.sections.status.sendCompleted",
        titleValues: { ticker: "BTC" },
        labelKey: "swap2.modals.transactionStatus.statusLabels.finished",
      },
      receive: {
        displayStatus: "error",
        titleKey: "swap2.modals.transactionStatus.sections.status.receivePending",
        titleValues: { ticker: "ETH" },
        labelKey: "swap2.modals.transactionStatus.statusLabels.cancelled",
      },
    });
  });

  it.each([
    ["success", { icon: "success", tone: "success" }],
    ["error", { icon: "error", tone: "error" }],
    ["pending", { icon: "pending", tone: "muted" }],
    ["unknown", { icon: "pending", tone: "muted" }],
  ] as const)("should build visual tokens for %s display statuses", (status, visualTokens) => {
    expect(getSwapTransactionStatusVisualTokens(status)).toEqual(visualTokens);
  });
});
