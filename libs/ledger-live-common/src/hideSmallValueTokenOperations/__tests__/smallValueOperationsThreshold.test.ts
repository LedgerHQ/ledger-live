import BigNumber from "bignumber.js";
import { getFiatCurrencyByTicker } from "../../currencies";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@domain/entity-currency";
import {
  clampSmallValueThresholdUsd,
  convertThresholdFromCountervalueMinorUnitToUsd,
  convertThresholdFromUsdToCountervalueMinorUnit,
  convertThresholdMinorUnitToMajor,
  floorThresholdToCurrencyMinorUnit,
  formatThresholdMinorUnitForInput,
  formatSmallValueOperationsThreshold,
  isSmallValueOperation,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "../smallValueOperationsThreshold";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn(),
}));

import { calculate } from "@ledgerhq/live-countervalues/logic";

const mockCalculate = jest.mocked(calculate);
const mockCountervaluesState: CounterValuesState = { data: {}, status: {}, cache: {} };
const USD = getFiatCurrencyByTicker("USD");
const EUR = getFiatCurrencyByTicker("EUR");
const JPY = getFiatCurrencyByTicker("JPY");

describe("smallValueOperationsThreshold", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("clampSmallValueThresholdUsd", () => {
    it.each([
      {
        threshold: 0.42,
        fallback: 0,
        expected: 0.42,
        desc: "keeps a finite threshold within bounds",
      },
      { threshold: -1, fallback: 0.5, expected: 0, desc: "floors negative thresholds to zero" },
      { threshold: 0.75, fallback: 0, expected: 0.5, desc: "caps thresholds above the USD max" },
      {
        threshold: Number.NaN,
        fallback: 0.25,
        expected: 0.25,
        desc: "falls back when threshold is not finite",
      },
    ])("$desc", ({ threshold, fallback, expected }) => {
      expect(clampSmallValueThresholdUsd(threshold, fallback)).toBe(expected);
    });
  });

  describe("floorThresholdToCurrencyMinorUnit", () => {
    it.each([
      {
        threshold: 0.509,
        currency: "USD",
        expected: "50",
        desc: "floors to the displayed currency magnitude",
      },
      {
        threshold: 72.9,
        currency: "JPY",
        expected: "72",
        desc: "avoids fractional values for zero-magnitude currencies",
      },
    ])("$desc: floor($threshold, $currency) -> $expected", ({ threshold, currency, expected }) => {
      const curr = getFiatCurrencyByTicker(currency);
      expect(floorThresholdToCurrencyMinorUnit(threshold, curr)?.toString()).toBe(expected);
    });

    it("should return null when threshold is not finite", () => {
      expect(floorThresholdToCurrencyMinorUnit(Number.POSITIVE_INFINITY, USD)).toBeNull();
    });
  });

  describe("minor unit formatting helpers", () => {
    it("should convert minor units back to major units", () => {
      expect(convertThresholdMinorUnitToMajor(new BigNumber(46), EUR).toString()).toBe("0.46");
    });

    it("should format the input value without forcing trailing zeros", () => {
      expect(formatThresholdMinorUnitForInput(new BigNumber(50), USD)).toBe("0.5");
    });
  });

  describe("formatSmallValueOperationsThreshold", () => {
    it("should format the dust filter threshold in USD without a reference conversion", () => {
      expect(
        formatSmallValueOperationsThreshold({
          counterValueCurrency: USD,
          locale: "en-US",
          thresholdUsd: 0.01,
        }),
      ).toBe("US$0.01");
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("should include the converted threshold when the countervalue is not USD", () => {
      mockCalculate.mockReturnValue(0.92);

      expect(
        formatSmallValueOperationsThreshold({
          countervaluesState: mockCountervaluesState,
          counterValueCurrency: EUR,
          locale: "en-US",
          thresholdUsd: 0.01,
        }),
      ).toBe("US$0.01 (€0.0092)");
    });

    it("should format the converted threshold with the current locale", () => {
      mockCalculate.mockReturnValue(0.92);

      expect(
        formatSmallValueOperationsThreshold({
          countervaluesState: mockCountervaluesState,
          counterValueCurrency: EUR,
          locale: "fr-FR",
          thresholdUsd: 0.01,
        }),
      ).toBe("US$0,01 (€0,0092)");
    });
  });

  describe("convertThresholdFromUsdToCountervalueMinorUnit", () => {
    it("should convert the canonical USD threshold to countervalue minor units", () => {
      mockCalculate.mockReturnValue(72.8);

      const result = convertThresholdFromUsdToCountervalueMinorUnit({
        counterValueCurrency: JPY,
        countervaluesState: mockCountervaluesState,
        thresholdUsd: 0.5,
      });

      expect(result?.toString()).toBe("72.8");
      expect(mockCalculate).toHaveBeenCalledWith(mockCountervaluesState, {
        from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
        to: JPY,
        value: 50,
        disableRounding: true,
      });
    });

    it("should clamp the USD threshold before converting", () => {
      mockCalculate.mockReturnValue(46);

      convertThresholdFromUsdToCountervalueMinorUnit({
        counterValueCurrency: EUR,
        countervaluesState: mockCountervaluesState,
        thresholdUsd: 1,
      });

      expect(mockCalculate).toHaveBeenCalledWith(
        mockCountervaluesState,
        expect.objectContaining({
          value: 50,
        }),
      );
    });

    it("should return null when countervalue conversion is unavailable", () => {
      mockCalculate.mockReturnValue(undefined);

      const result = convertThresholdFromUsdToCountervalueMinorUnit({
        counterValueCurrency: EUR,
        countervaluesState: mockCountervaluesState,
        thresholdUsd: 0.5,
      });

      expect(result).toBeNull();
    });
  });

  describe("convertThresholdFromCountervalueMinorUnitToUsd", () => {
    it("should convert displayed countervalue minor units back to canonical USD", () => {
      mockCalculate.mockReturnValue(40.2);

      const result = convertThresholdFromCountervalueMinorUnitToUsd({
        counterValueCurrency: EUR,
        countervaluesState: mockCountervaluesState,
        thresholdMinorUnit: new BigNumber(37),
      });

      expect(result).toBe(0.402);
      expect(mockCalculate).toHaveBeenCalledWith(mockCountervaluesState, {
        from: USD,
        to: EUR,
        value: 37,
        disableRounding: true,
        reverse: true,
      });
    });

    it("should return null when the reverse conversion is unavailable", () => {
      mockCalculate.mockReturnValue(Number.POSITIVE_INFINITY);

      const result = convertThresholdFromCountervalueMinorUnitToUsd({
        counterValueCurrency: EUR,
        countervaluesState: mockCountervaluesState,
        thresholdMinorUnit: new BigNumber(37),
      });

      expect(result).toBeNull();
    });
  });

  describe("isSmallValueOperation", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockToken = { ticker: "MOCK", units: [{ magnitude: 6 }] } as TokenCurrency;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const mockNativeCurrency = {
      ticker: "MOCK_NATIVE",
      units: [{ magnitude: 10 }],
    } as CryptoCurrency;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const tokenAccount = { type: "TokenAccount", token: mockToken } as AccountLike;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const regularAccount = { type: "Account", currency: mockNativeCurrency } as AccountLike;

    const buildOp = (type: string, value: BigNumber): Operation =>
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      ({ type, value }) as Operation;

    const mockSmallValueCalculations = (
      operationCurrency: CryptoCurrency | TokenCurrency,
      opFiatValue: number | undefined,
      thresholdFiatValue = 50,
    ) => {
      mockCalculate.mockImplementation((_state, query) => {
        if (query.from === operationCurrency) return opFiatValue;
        if (query.from === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY) {
          return thresholdFiatValue;
        }
        return undefined;
      });
    };

    it("should keep non-transfer operations without calling calculate", () => {
      const result = isSmallValueOperation({
        operation: buildOp("FEES", new BigNumber(0)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(false);
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("should return true when an incoming native operation has exactly 0 crypto value", () => {
      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(0)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true);
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("should return true when an outgoing native operation has exactly 0 crypto value", () => {
      const result = isSmallValueOperation({
        operation: buildOp("OUT", new BigNumber(0)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true);
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    it("should return true when token IN operation has exactly 0 crypto value", () => {
      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(0)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true);
      expect(mockCalculate).not.toHaveBeenCalled();
    });

    // The USD threshold is converted to 50 EUR cents; calculate also returns
    // the operation's fiat value in EUR minor units.
    it.each([
      { fiatValue: 49, opValue: 499_999, expected: true, desc: "strictly below threshold -> dust" },
      {
        fiatValue: 50,
        opValue: 500_000,
        expected: false,
        desc: "equal to threshold -> not dust (strict lt)",
      },
      { fiatValue: 51, opValue: 510_000, expected: false, desc: "above threshold -> not dust" },
    ])("$desc", ({ fiatValue, opValue, expected }) => {
      mockSmallValueCalculations(mockToken, fiatValue);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(opValue)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(expected);
    });

    it.each([
      { fiatValue: 49, opValue: 499_999, expected: true, desc: "below threshold -> dust" },
      { fiatValue: 51, opValue: 510_000, expected: false, desc: "above threshold -> not dust" },
    ])("should handle incoming native operations $desc", ({ fiatValue, opValue, expected }) => {
      mockSmallValueCalculations(mockNativeCurrency, fiatValue);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(opValue)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(expected);
    });

    it.each([
      { fiatValue: 49, opValue: 499_999, expected: true, desc: "below threshold -> dust" },
      { fiatValue: 51, opValue: 510_000, expected: false, desc: "above threshold -> not dust" },
    ])("should handle outgoing native operations $desc", ({ fiatValue, opValue, expected }) => {
      mockSmallValueCalculations(mockNativeCurrency, fiatValue);

      const result = isSmallValueOperation({
        operation: buildOp("OUT", new BigNumber(opValue)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(expected);
    });

    it("should filter outgoing token operations below the dust threshold", () => {
      mockSmallValueCalculations(mockToken, 49);

      const result = isSmallValueOperation({
        operation: buildOp("OUT", new BigNumber(499_999)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true);
    });

    it.each([
      { fiatValue: undefined, desc: "calculate returns undefined" },
      { fiatValue: Number.POSITIVE_INFINITY, desc: "calculate returns Infinity" },
    ])("should not filter when price feed is unavailable ($desc)", ({ fiatValue }) => {
      mockSmallValueCalculations(mockNativeCurrency, fiatValue);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(1_000_000)),
        account: regularAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(false);
    });

    it("should correctly filter a dust amount from an 18-decimal token", () => {
      // Scenario: 18-decimal token, op worth ~1 EUR cent (dust)
      // calculate(token -> EUR, 10^20) -> 1 EUR cent ; threshold = 50 EUR cents
      mockSmallValueCalculations(mockToken, 1);

      const dustAmount = new BigNumber("100").times(new BigNumber(10).pow(18)); // 10^20

      const result = isSmallValueOperation({
        operation: buildOp("IN", dustAmount),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true); // 1 EUR cent < 50 EUR cent threshold -> dust
    });

    it("should use a custom feature flag thresholdUsd when provided", () => {
      mockSmallValueCalculations(mockToken, 24, 25);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(249_999)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
        thresholdUsd: 0.25,
      });

      expect(result).toBe(true);
      expect(mockCalculate).toHaveBeenCalledWith(
        mockCountervaluesState,
        expect.objectContaining({
          from: mockToken,
          to: EUR,
          value: 249_999,
          disableRounding: true,
        }),
      );
    });

    it("should fall back to the default threshold ($0.5 -> 50 EUR cents) when thresholdUsd is omitted", () => {
      mockSmallValueCalculations(mockToken, 1);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(1)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: EUR,
      });

      expect(result).toBe(true);
    });

    it("should return false when the converted threshold is zero", () => {
      // A zero threshold is treated as "no threshold" to avoid filtering all operations.
      mockSmallValueCalculations(mockToken, 0, 0);

      const result = isSmallValueOperation({
        operation: buildOp("IN", new BigNumber(1)),
        account: tokenAccount,
        countervaluesState: mockCountervaluesState,
        userCounterValueCurrency: JPY,
      });

      expect(result).toBe(false);
    });
  });
});
