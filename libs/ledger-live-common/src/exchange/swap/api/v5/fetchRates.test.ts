import { throwRateError } from "./fetchRates"; // Make sure the path is correct
import { ExchangeRate } from "../../types";
import { BigNumber } from "bignumber.js";

describe("throwRateError", () => {
  describe("SwapExchangeRateAmountTooHigh Error", () => {
    const response: ExchangeRate[] = [
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "paraswap",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "oneinch",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
    ];
    // Call the function and expect it to throw an exception
    try {
      throwRateError(response);
      // Fail test if above expression doesn't throw anything.
      expect(true).toBe(false);
    } catch (e: any) {
      expect(e["name"]).toBe("SwapGenericAPIError");
    }
  });
  describe("SwapExchangeRateAmountTooHigh Error", () => {
    const response: ExchangeRate[] = [
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "changelly",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {
          name: "SwapExchangeRateAmountTooHigh",
          maxAmountFromFormatted: "34.2 XTZ",
          amount: new BigNumber(34.2),
        },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "paraswap",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "oneinch",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
    ];
    const leastRestrictiveRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber(0),
      payoutNetworkFees: new BigNumber(0),
      provider: "changelly",
      providerType: "CEX",
      toAmount: new BigNumber(0),
      tradeMethod: "float",
      error: {
        name: "SwapExchangeRateAmountTooHigh",
        maxAmountFromFormatted: "120.48 XTZ",
        amount: new BigNumber(120.48),
      },
    };
    it("should throw a SwapExchangeRateAmountTooHigh exception with the least restrictive rate at the beginning of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([leastRestrictiveRate, ...response]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooHigh",
          maxAmountFromFormatted: "120.48\xa0XTZ",
          amount: new BigNumber(120.48),
        });
      }
    });
    it("should throw a SwapExchangeRateAmountTooHigh exception with the least restrictive rate at the end of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([...response, leastRestrictiveRate]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooHigh",
          maxAmountFromFormatted: "120.48\xa0XTZ",
          amount: new BigNumber(120.48),
        });
      }
    });
  });
  describe("SwapExchangeRateAmountTooLow Error", () => {
    const response: ExchangeRate[] = [
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "changelly",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {
          name: "SwapExchangeRateAmountTooLow",
          minAmountFromFormatted: "120.48 XTZ",
          amount: new BigNumber(120.48),
        },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "paraswap",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "oneinch",
        providerType: "DEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: { name: "CurrencyNotSupportedError" },
      },
    ];
    const leastRestrictiveRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber(0),
      payoutNetworkFees: new BigNumber(0),
      provider: "changelly",
      providerType: "CEX",
      toAmount: new BigNumber(0),
      tradeMethod: "float",
      error: {
        name: "SwapExchangeRateAmountTooLow",
        minAmountFromFormatted: "34.2 XTZ",
        amount: new BigNumber(34.2),
      },
    };
    it("should throw a SwapExchangeRateAmountTooLow exception with the least restrictive rate at the beginning of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([leastRestrictiveRate, ...response]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooLow",
          minAmountFromFormatted: "34.2\xa0XTZ",
          amount: new BigNumber(34.2),
        });
      }
    });
    it("should throw a SwapExchangeRateAmountTooLow exception with the least restrictive rate at the end of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([...response, leastRestrictiveRate]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooLow",
          minAmountFromFormatted: "34.2\xa0XTZ",
          amount: new BigNumber(34.2),
        });
      }
    });
  });
  describe("SwapExchangeRateAmountTooLowOrTooHigh Error", () => {
    const response: ExchangeRate[] = [
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "changelly",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {
          name: "SwapExchangeRateAmountTooLow",
          minAmountFromFormatted: "0.05354428 ETH",
          amount: new BigNumber(0.05354428),
        },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "changelly",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: {
          name: "SwapExchangeRateAmountTooLow",
          minAmountFromFormatted: "0.0201 ETH",
          amount: new BigNumber(0.0201),
        },
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "fixed",
        error: {},
      },
      {
        magnitudeAwareRate: new BigNumber(0),
        payoutNetworkFees: new BigNumber(0),
        provider: "cic",
        providerType: "CEX",
        toAmount: new BigNumber(0),
        tradeMethod: "float",
        error: {},
      },
    ];
    const dexLimiteRate: ExchangeRate = {
      magnitudeAwareRate: new BigNumber(0),
      payoutNetworkFees: new BigNumber(0),
      provider: "oneinch",
      providerType: "DEX",
      toAmount: new BigNumber(0),
      tradeMethod: "float",
      error: { name: "SwapExchangeRateAmountTooLowOrTooHigh" },
    };
    it("should throw a SwapExchangeRateAmountTooLowOrTooHigh exception with the least restrictive rate at the beginning of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([dexLimiteRate, ...response]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooLowOrTooHigh",
        });
      }
    });
    it("should throw a SwapExchangeRateAmountTooLowOrTooHigh exception with the least restrictive rate at the end of the array", () => {
      // Call the function and expect it to throw an exception
      try {
        throwRateError([...response, dexLimiteRate]);
        // Fail test if above expression doesn't throw anything.
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toStrictEqual({
          name: "SwapExchangeRateAmountTooLowOrTooHigh",
        });
      }
    });
  });
});
