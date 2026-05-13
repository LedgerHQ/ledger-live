import BigNumber from "bignumber.js";

import type { FormattedNumber } from "@ledgerhq/wallet-api-exchange-module";

import { formatQuote } from "./formatQuote";
import type { CurrencyMeta, FiatMeta, FormatQuoteInput } from "./types";

const ETH: CurrencyMeta = { id: "ethereum", decimals: 18, ticker: "ETH" };
const USDC: CurrencyMeta = {
  id: "ethereum/erc20/usd__coin",
  decimals: 6,
  ticker: "USDC",
};
const USD: FiatMeta = { ticker: "USD", symbol: "$", magnitude: 2 };
const EUR: FiatMeta = { ticker: "EUR", symbol: "€", magnitude: 2 };

const NBSP = "\u00A0";
const EMPTY: FormattedNumber = { numberValue: "", withPrefix: "", withSuffix: "" };

/**
 * Convenience matcher for crypto-ticker triplets: the ticker is glued
 * to both sides with a non-breaking space so consumers can pick the
 * side that matches their layout.
 */
function cryptoTriplet(numberValue: string, ticker: string): FormattedNumber {
  return {
    numberValue,
    withPrefix: `${ticker}${NBSP}${numberValue}`,
    withSuffix: `${numberValue}${NBSP}${ticker}`,
  };
}

/**
 * Matcher for fiat countervalue triplets: the symbol is glued flush on
 * the prefix side (`$4,500`) and separated by a non-breaking space on
 * the suffix side (`4,500\u00A0$`).
 */
function fiatTriplet(numberValue: string, symbol: string): FormattedNumber {
  return {
    numberValue,
    withPrefix: `${symbol}${numberValue}`,
    withSuffix: `${numberValue}${NBSP}${symbol}`,
  };
}

function makeInput(overrides: Partial<FormatQuoteInput> = {}): FormatQuoteInput {
  return {
    quote: {
      type: "float",
      sendAmount: 1.5,
      receiveAmount: 4500,
      exchangeRate: 3000,
      slippage: 0,
      networkFeesCurrencyId: "ethereum",
    },
    networkFeeAmount: new BigNumber("0.0005"),
    sendCurrency: ETH,
    receiveCurrency: USDC,
    networkFeesCurrency: ETH,
    fiat: USD,
    spotPrices: {
      ethereum: 3000,
      "ethereum/erc20/usd__coin": 1,
    },
    locale: "en",
    ...overrides,
  };
}

describe("formatQuote", () => {
  describe("crypto amount triplets", () => {
    it("returns {numberValue, withPrefix, withSuffix} with ticker glued via NBSP", () => {
      const out = formatQuote(makeInput({ quote: { ...makeInput().quote, sendAmount: 1234.5 } }));
      expect(out.sendAmount).toEqual(cryptoTriplet("1,234.5", "ETH"));
    });

    it("caps crypto decimals at DEFAULT_MAX_DECIMALS=8 even when currency magnitude is larger", () => {
      const out = formatQuote(
        makeInput({ quote: { ...makeInput().quote, sendAmount: "1.0123456789" } }),
      );
      expect(out.sendAmount).toEqual(cryptoTriplet("1.01234568", "ETH"));
    });

    it("falls back to DEFAULT_MAX_DECIMALS and empty suffix when send currency metadata is missing", () => {
      const out = formatQuote(
        makeInput({
          sendCurrency: undefined,
          quote: { ...makeInput().quote, sendAmount: "1.0123456789" },
        }),
      );
      // No ticker → all three variants collapse to the bare number.
      expect(out.sendAmount).toEqual({
        numberValue: "1.01234568",
        withPrefix: "1.01234568",
        withSuffix: "1.01234568",
      });
    });

    it("never decorates receiveAmount with an approximate marker — quote.type is passed through for the consumer to render", () => {
      const floatOut = formatQuote(makeInput({ quote: { ...makeInput().quote, type: "float" } }));
      const fixedOut = formatQuote(makeInput({ quote: { ...makeInput().quote, type: "fixed" } }));
      expect(floatOut.receiveAmount).toEqual(cryptoTriplet("4,500", "USDC"));
      expect(fixedOut.receiveAmount).toEqual(cryptoTriplet("4,500", "USDC"));
      expect(floatOut.receiveAmount.numberValue).not.toContain("~");
      expect(floatOut.receiveAmount.withPrefix).not.toContain("~");
      expect(floatOut.receiveAmount.withSuffix).not.toContain("~");
    });

    it("formats the network fee triplet using the fee currency metadata", () => {
      const out = formatQuote(makeInput({ networkFeeAmount: new BigNumber("0.00012345") }));
      expect(out.networkFee).toEqual(cryptoTriplet("0.00012345", "ETH"));
    });
  });

  describe("rate triplet", () => {
    /**
     * Single full rate string duplicated across all three fields. Rate
     * needs both a send-side prefix and a receive-side suffix, and we
     * intentionally don't split variants for it today; richer splits
     * can be added later if a consumer needs them.
     */
    function fullRateTriplet(rate: string): FormattedNumber {
      return { numberValue: rate, withPrefix: rate, withSuffix: rate };
    }

    it("returns `1 <from> = <value> <to>` on every field", () => {
      const out = formatQuote(makeInput());
      expect(out.rate).toEqual(fullRateTriplet(`1 ETH = 3,000${NBSP}USDC`));
    });

    it("drops the `1 <from> = ` prefix when the send currency is missing", () => {
      const out = formatQuote(makeInput({ sendCurrency: undefined }));
      expect(out.rate).toEqual(fullRateTriplet(`3,000${NBSP}USDC`));
    });

    it("drops the ticker suffix when the receive currency is missing", () => {
      const out = formatQuote(makeInput({ receiveCurrency: undefined }));
      expect(out.rate).toEqual(fullRateTriplet("1 ETH = 3,000"));
    });
  });

  describe("slippage triplet", () => {
    it.each<[number, string]>([
      [0, "0"],
      [1, "1"],
      [2, "2"],
    ])("passes safe integers through — withSuffix = '%p%%'", (slippage, expectedNumber) => {
      const out = formatQuote(makeInput({ quote: { ...makeInput().quote, slippage } }));
      expect(out.slippage).toEqual({
        numberValue: expectedNumber,
        withPrefix: expectedNumber,
        withSuffix: `${expectedNumber}%`,
      });
    });

    it("rounds fractional slippage to 1 decimal place", () => {
      const out = formatQuote(makeInput({ quote: { ...makeInput().quote, slippage: 0.05 } }));
      expect(out.slippage).toEqual({
        numberValue: "0.1",
        withPrefix: "0.1",
        withSuffix: "0.1%",
      });
    });

    it("mirrors the swap-live-app lifi 0.7775697944164467 case", () => {
      const out = formatQuote(
        makeInput({ quote: { ...makeInput().quote, slippage: 0.7775697944164467 } }),
      );
      expect(out.slippage.withSuffix).toBe("0.8%");
    });

    it("glues `%` flush against the number (no NBSP separator)", () => {
      const out = formatQuote(makeInput({ quote: { ...makeInput().quote, slippage: 0 } }));
      // Negative assertion: withSuffix is `"0%"`, not `"0\u00A0%"`.
      expect(out.slippage.withSuffix).toBe("0%");
      expect(out.slippage.withSuffix).not.toContain(NBSP);
    });
  });

  describe("fiat countervalue triplets", () => {
    it("carries the fiat symbol on both prefix and suffix; caps decimals at fiat magnitude", () => {
      const out = formatQuote(makeInput());
      // 1.5 ETH * 3000 USD/ETH = 4,500 USD
      expect(out.sendAmountCountervalue).toEqual(fiatTriplet("4,500", "$"));
      // 4500 USDC * 1 USD/USDC = 4,500 USD
      expect(out.receiveAmountCountervalue).toEqual(fiatTriplet("4,500", "$"));
    });

    it("honors the caller-supplied fiat symbol (EUR)", () => {
      const out = formatQuote(
        makeInput({
          fiat: EUR,
          spotPrices: { ethereum: 2800, "ethereum/erc20/usd__coin": 0.92 },
        }),
      );
      expect(out.sendAmountCountervalue).toEqual(fiatTriplet("4,200", "€"));
      expect(out.receiveAmountCountervalue).toEqual(fiatTriplet("4,140", "€"));
    });

    it("collapses the send countervalue to EMPTY when no spot price is available", () => {
      const out = formatQuote(makeInput({ spotPrices: { "ethereum/erc20/usd__coin": 1 } }));
      expect(out.sendAmountCountervalue).toEqual(EMPTY);
    });

    it("collapses the receive countervalue to EMPTY when the receive currency is missing", () => {
      const out = formatQuote(makeInput({ receiveCurrency: undefined }));
      expect(out.receiveAmountCountervalue).toEqual(EMPTY);
    });

    it("falls back to the raw networkFee triplet when the fee spot price is missing", () => {
      const out = formatQuote(
        makeInput({
          spotPrices: { "ethereum/erc20/usd__coin": 1 },
          networkFeeAmount: new BigNumber("0.0005"),
        }),
      );
      expect(out.networkFeeCountervalue).toEqual(out.networkFee);
      expect(out.networkFeeCountervalue).toEqual(cryptoTriplet("0.0005", "ETH"));
    });

    it("uses quote.networkFeesCurrencyId as the primary spot key, not networkFeesCurrency.id", () => {
      const out = formatQuote(
        makeInput({
          quote: { ...makeInput().quote, networkFeesCurrencyId: "eth-network-fees" },
          networkFeesCurrency: { ...ETH, id: "ignored-fallback" },
          spotPrices: {
            ethereum: 3000,
            "ethereum/erc20/usd__coin": 1,
            "eth-network-fees": 3000,
          },
          networkFeeAmount: new BigNumber("0.001"),
        }),
      );
      expect(out.networkFeeCountervalue).toEqual(fiatTriplet("3", "$"));
    });

    it("falls back to networkFeesCurrency.id when quote.networkFeesCurrencyId is empty", () => {
      const out = formatQuote(
        makeInput({
          quote: { ...makeInput().quote, networkFeesCurrencyId: "" },
          networkFeesCurrency: { ...ETH, id: "ethereum-fallback" },
          spotPrices: {
            "ethereum-fallback": 3000,
            ethereum: 3000,
            "ethereum/erc20/usd__coin": 1,
          },
          networkFeeAmount: new BigNumber("0.001"),
        }),
      );
      expect(out.networkFeeCountervalue).toEqual(fiatTriplet("3", "$"));
    });
  });

  describe("full snapshot parity", () => {
    it("returns all eight FormattedQuoteValues fields for a realistic ETH→USDC float quote", () => {
      const out = formatQuote(makeInput());
      expect(out).toStrictEqual({
        sendAmount: cryptoTriplet("1.5", "ETH"),
        sendAmountCountervalue: fiatTriplet("4,500", "$"),
        receiveAmount: cryptoTriplet("4,500", "USDC"),
        receiveAmountCountervalue: fiatTriplet("4,500", "$"),
        networkFee: cryptoTriplet("0.0005", "ETH"),
        networkFeeCountervalue: fiatTriplet("1.5", "$"),
        rate: {
          numberValue: `1 ETH = 3,000${NBSP}USDC`,
          withPrefix: `1 ETH = 3,000${NBSP}USDC`,
          withSuffix: `1 ETH = 3,000${NBSP}USDC`,
        },
        slippage: {
          numberValue: "0",
          withPrefix: "0",
          withSuffix: "0%",
        },
      });
    });
  });
});
