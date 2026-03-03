import { renderHook, act } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import { useAmountInputController } from "../useAmountInputController";
import { useSelector } from "~/context/hooks";
import {
  useSendAmount,
  useCalculateCountervalueCallback,
} from "@ledgerhq/live-countervalues-react";
import { useLocale } from "~/context/Locale";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/generated/types";

jest.mock("~/context/hooks");
jest.mock("@ledgerhq/live-countervalues-react");
jest.mock("~/context/Locale");
jest.mock("LLM/hooks/useAccountUnit");
jest.mock("@ledgerhq/coin-framework/account/helpers");

const btcUnit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
const usdUnit = { name: "US Dollar", code: "USD", magnitude: 2 };

const mockCurrency = {
  id: "bitcoin",
  family: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [btcUnit],
};

const mockCounterValueCurrency = {
  id: "USD",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [usdUnit],
};

const mockAccount = {
  id: "mock-account",
  balance: new BigNumber(100_000_000),
  currency: mockCurrency,
  type: "Account",
} as unknown as Account;

const mockStatus = {
  errors: {},
  warnings: {},
  estimatedFees: new BigNumber(1000),
  amount: new BigNumber(0),
} as unknown as TransactionStatus;

const baseTransaction = {
  family: "bitcoin",
  recipient: "",
  amount: new BigNumber(0),
  useAllAmount: false,
} as unknown as Transaction;

const mockCalculateCryptoAmount = jest.fn().mockReturnValue(new BigNumber(50_000_000));
const mockCalculateFiatFromCrypto = jest
  .fn()
  .mockImplementation((_currency: unknown, amount: BigNumber) =>
    amount.isZero() ? null : new BigNumber(500_00),
  );

describe("useAmountInputController", () => {
  const onUpdateTransaction = jest.fn();

  const defaultParams = {
    account: mockAccount,
    parentAccount: null,
    transaction: baseTransaction,
    status: mockStatus,
    onUpdateTransaction,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    jest
      .mocked(useSelector)
      .mockReturnValue(mockCounterValueCurrency as ReturnType<typeof useSelector>);
    jest.mocked(useLocale).mockReturnValue({ locale: "en" } as ReturnType<typeof useLocale>);
    jest
      .mocked(useMaybeAccountUnit)
      .mockReturnValue(btcUnit as ReturnType<typeof useMaybeAccountUnit>);
    jest.mocked(getMainAccount).mockReturnValue(mockAccount as ReturnType<typeof getMainAccount>);
    jest
      .mocked(getAccountCurrency)
      .mockReturnValue(mockCurrency as ReturnType<typeof getAccountCurrency>);
    jest.mocked(useSendAmount).mockReturnValue({
      fiatAmount: new BigNumber(0),
      fiatUnit: usdUnit,
      calculateCryptoAmount: mockCalculateCryptoAmount,
    } as unknown as ReturnType<typeof useSendAmount>);
    jest
      .mocked(useCalculateCountervalueCallback)
      .mockReturnValue(
        mockCalculateFiatFromCrypto as ReturnType<typeof useCalculateCountervalueCallback>,
      );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("starts with empty value in fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(result.current.value).toBe("");
      expect(result.current.inputMode).toBe("fiat");
    });

    it("starts with isTyping false", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(result.current.isTyping).toBe(false);
    });

    it("starts with currency position left for fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(result.current.currencyPosition).toBe("left");
    });

    it("starts with max decimal length 2 for fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(result.current.maxDecimalLength).toBe(2);
    });

    it("exposes required callbacks", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(typeof result.current.onChangeText).toBe("function");
      expect(typeof result.current.onToggleMode).toBe("function");
      expect(typeof result.current.updateBothInputs).toBe("function");
      expect(typeof result.current.cancelPendingUpdates).toBe("function");
    });
  });

  describe("onToggleMode", () => {
    it("switches from fiat to crypto mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });

      expect(result.current.inputMode).toBe("crypto");
    });

    it("switches from crypto back to fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });
      act(() => {
        result.current.onToggleMode();
      });

      expect(result.current.inputMode).toBe("fiat");
    });

    it("sets currency position right in crypto mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });

      expect(result.current.currencyPosition).toBe("right");
    });

    it("uses account unit magnitude for maxDecimalLength in crypto mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });

      // btcUnit.magnitude = 8
      expect(result.current.maxDecimalLength).toBe(8);
    });

    it("shows currency code as currencyText in crypto mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });

      expect(result.current.currencyText).toBe("BTC");
    });

    it("shows currency symbol as currencyText in fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      expect(result.current.currencyText).toBe("$");
    });
  });

  describe("onChangeText", () => {
    it("sets isTyping to true while typing", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("1");
      });

      expect(result.current.isTyping).toBe(true);
    });

    it("sets isTyping back to false after 2 seconds of inactivity", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("1");
      });
      expect(result.current.isTyping).toBe(true);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isTyping).toBe(false);
    });

    it("updates fiat input value in fiat mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("100");
      });

      expect(result.current.value).toBe("100");
    });

    it("debounces onUpdateTransaction call by 500ms", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("100");
      });

      expect(onUpdateTransaction).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onUpdateTransaction).toHaveBeenCalled();
    });

    it("calls onUpdateTransaction with amount and useAllAmount:false", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("100");
        jest.advanceTimersByTime(500);
      });

      expect(onUpdateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ useAllAmount: false }),
      );
    });

    it("updates crypto input value in crypto mode", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onToggleMode();
      });

      act(() => {
        result.current.onChangeText("0.5");
      });

      expect(result.current.value).toBe("0.5");
    });

    it("cancels previous debounce on rapid typing", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("1");
      });
      act(() => {
        jest.advanceTimersByTime(400);
        result.current.onChangeText("12");
      });
      act(() => {
        jest.advanceTimersByTime(400);
      });

      // 500ms hasn't passed since the last keystroke
      expect(onUpdateTransaction).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(onUpdateTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("useAllAmount sync", () => {
    it("updates fiat input value when useAllAmount becomes true", () => {
      jest.mocked(useSendAmount).mockReturnValue({
        fiatAmount: new BigNumber(50_000), // $500.00 in cents
        fiatUnit: usdUnit,
        calculateCryptoAmount: mockCalculateCryptoAmount,
      } as unknown as ReturnType<typeof useSendAmount>);

      const { result } = renderHook(() =>
        useAmountInputController({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: true } as unknown as Transaction,
          status: {
            ...mockStatus,
            amount: new BigNumber(90_000_000),
          } as unknown as TransactionStatus,
        }),
      );

      // When useAllAmount=true, input should reflect the bridge-computed fiat value
      expect(result.current.value).not.toBe("");
    });

    it("updates crypto input value when useAllAmount=true and in crypto mode", () => {
      const { result } = renderHook(() =>
        useAmountInputController({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: true } as unknown as Transaction,
          status: {
            ...mockStatus,
            amount: new BigNumber(90_000_000),
          } as unknown as TransactionStatus,
        }),
      );

      act(() => {
        result.current.onToggleMode();
      });

      // In crypto mode with useAllAmount, input shows the bridge amount
      expect(result.current.value).not.toBe("");
    });

    it("does not sync when useAllAmount is false", () => {
      const { result } = renderHook(() =>
        useAmountInputController({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: false } as unknown as Transaction,
        }),
      );

      // With no user input, value stays empty
      expect(result.current.value).toBe("");
    });
  });

  describe("updateBothInputs", () => {
    it("sets crypto input value with formatted amount", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.updateBothInputs(new BigNumber(50_000_000)); // 0.5 BTC
      });

      // Should not be empty after setting an amount
      expect(result.current.value).not.toBe("");
    });

    it("clears fiat input when amount is zero", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("100");
      });
      act(() => {
        result.current.updateBothInputs(new BigNumber(0));
      });

      // Fiat input should be cleared when 0 amount is set
      expect(result.current.value).toBe("");
    });
  });

  describe("cancelPendingUpdates", () => {
    it("cancels a pending debounced transaction update", () => {
      const { result } = renderHook(() => useAmountInputController(defaultParams));

      act(() => {
        result.current.onChangeText("100");
      });

      act(() => {
        result.current.cancelPendingUpdates();
        jest.advanceTimersByTime(500);
      });

      expect(onUpdateTransaction).not.toHaveBeenCalled();
    });
  });
});
