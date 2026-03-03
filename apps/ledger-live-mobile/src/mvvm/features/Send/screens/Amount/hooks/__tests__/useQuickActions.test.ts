import { renderHook, act } from "@testing-library/react-native";
import BigNumber from "bignumber.js";
import { useQuickActions } from "../useQuickActions";
import { useTranslation } from "~/context/Locale";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/coin-framework/account/helpers";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";

jest.mock("~/context/Locale");
jest.mock("LLM/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/bridge/descriptor");
jest.mock("@ledgerhq/coin-framework/account/helpers");

const btcUnit = { name: "Bitcoin", code: "BTC", magnitude: 8 };
const mockCurrency = {
  id: "bitcoin",
  family: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  units: [btcUnit],
};

const mockAccount = {
  id: "mock-account",
  balance: new BigNumber(100_000_000),
  currency: mockCurrency,
} as unknown as Account;

const baseTransaction = {
  family: "bitcoin",
  recipient: "",
  amount: new BigNumber(0),
  useAllAmount: false,
} as unknown as Transaction;

const maxAvailable = new BigNumber(90_000_000);

describe("useQuickActions", () => {
  const onSetAmountFromRatio = jest.fn();
  const onSelectMax = jest.fn();

  const defaultParams = {
    account: mockAccount,
    parentAccount: null,
    transaction: baseTransaction,
    maxAvailable,
    onSetAmountFromRatio,
    onSelectMax,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useTranslation)
      .mockReturnValue({ t: (key: string) => key } as ReturnType<typeof useTranslation>);
    jest
      .mocked(useMaybeAccountUnit)
      .mockReturnValue(btcUnit as ReturnType<typeof useMaybeAccountUnit>);
    jest.mocked(getMainAccount).mockReturnValue(mockAccount as ReturnType<typeof getMainAccount>);
    jest
      .mocked(getAccountCurrency)
      .mockReturnValue(mockCurrency as ReturnType<typeof getAccountCurrency>);
    jest.mocked(sendFeatures.canSendMax).mockReturnValue(true);
  });

  describe("structure", () => {
    it("returns 4 actions: quarter, half, threeQuarters, max", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      expect(result.current).toHaveLength(4);
      expect(result.current.map(a => a.id)).toEqual(["quarter", "half", "threeQuarters", "max"]);
    });

    it("uses translation keys for labels", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      expect(result.current[0].label).toBe("send.newSendFlow.quickActions.quarter");
      expect(result.current[1].label).toBe("send.newSendFlow.quickActions.half");
      expect(result.current[2].label).toBe("send.newSendFlow.quickActions.threeQuarters");
      expect(result.current[3].label).toBe("send.newSendFlow.quickActions.max");
    });
  });

  describe("disabled state", () => {
    it("disables all actions when balance is zero", () => {
      const zeroBalanceAccount = {
        ...mockAccount,
        balance: new BigNumber(0),
      } as unknown as Account;
      jest
        .mocked(getMainAccount)
        .mockReturnValue(zeroBalanceAccount as ReturnType<typeof getMainAccount>);

      const { result } = renderHook(() =>
        useQuickActions({ ...defaultParams, account: zeroBalanceAccount }),
      );

      expect(result.current.every(a => a.disabled)).toBe(true);
    });

    it("enables actions when balance is positive", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      expect(result.current.every(a => a.disabled)).toBe(false);
    });

    it("disables max when canSendMax returns false", () => {
      jest.mocked(sendFeatures.canSendMax).mockReturnValue(false);

      const { result } = renderHook(() => useQuickActions(defaultParams));

      const maxAction = result.current.find(a => a.id === "max");
      expect(maxAction?.disabled).toBe(true);
    });

    it("keeps ratio actions enabled when canSendMax is false", () => {
      jest.mocked(sendFeatures.canSendMax).mockReturnValue(false);

      const { result } = renderHook(() => useQuickActions(defaultParams));

      const ratioActions = result.current.filter(a => a.id !== "max");
      expect(ratioActions.every(a => !a.disabled)).toBe(true);
    });
  });

  describe("active state", () => {
    it("max is active when transaction.useAllAmount is true", () => {
      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: true } as unknown as Transaction,
        }),
      );

      const maxAction = result.current.find(a => a.id === "max");
      expect(maxAction?.active).toBe(true);
    });

    it("max is not active when useAllAmount is false", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      const maxAction = result.current.find(a => a.id === "max");
      expect(maxAction?.active).toBe(false);
    });

    it("ratio actions are not active when useAllAmount is true", () => {
      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: true } as unknown as Transaction,
        }),
      );

      const ratioActions = result.current.filter(a => a.id !== "max");
      expect(ratioActions.every(a => !a.active)).toBe(true);
    });

    it("quarter is active when transaction amount matches 25% of maxAvailable", () => {
      const quarterAmount = maxAvailable.multipliedBy(0.25).integerValue(BigNumber.ROUND_DOWN);

      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, amount: quarterAmount } as unknown as Transaction,
        }),
      );

      const quarterAction = result.current.find(a => a.id === "quarter");
      expect(quarterAction?.active).toBe(true);
    });

    it("half is active when transaction amount matches 50% of maxAvailable", () => {
      const halfAmount = maxAvailable.multipliedBy(0.5).integerValue(BigNumber.ROUND_DOWN);

      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, amount: halfAmount } as unknown as Transaction,
        }),
      );

      const halfAction = result.current.find(a => a.id === "half");
      expect(halfAction?.active).toBe(true);
    });

    it("no ratio action is active when amount does not match any preset", () => {
      const oddAmount = new BigNumber(12_345_678);

      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, amount: oddAmount } as unknown as Transaction,
        }),
      );

      const ratioActions = result.current.filter(a => a.id !== "max");
      expect(ratioActions.every(a => !a.active)).toBe(true);
    });
  });

  describe("onPress callbacks", () => {
    it("calls onSetAmountFromRatio with 25% of maxAvailable when quarter pressed", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      act(() => {
        result.current.find(a => a.id === "quarter")?.onPress();
      });

      const expected = maxAvailable.multipliedBy(0.25).integerValue(BigNumber.ROUND_DOWN);
      expect(onSetAmountFromRatio).toHaveBeenCalledWith(expected);
    });

    it("calls onSetAmountFromRatio with 50% of maxAvailable when half pressed", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      act(() => {
        result.current.find(a => a.id === "half")?.onPress();
      });

      const expected = maxAvailable.multipliedBy(0.5).integerValue(BigNumber.ROUND_DOWN);
      expect(onSetAmountFromRatio).toHaveBeenCalledWith(expected);
    });

    it("calls onSetAmountFromRatio with 75% of maxAvailable when threeQuarters pressed", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      act(() => {
        result.current.find(a => a.id === "threeQuarters")?.onPress();
      });

      const expected = maxAvailable.multipliedBy(0.75).integerValue(BigNumber.ROUND_DOWN);
      expect(onSetAmountFromRatio).toHaveBeenCalledWith(expected);
    });

    it("calls onSelectMax when max pressed", () => {
      const { result } = renderHook(() => useQuickActions(defaultParams));

      act(() => {
        result.current.find(a => a.id === "max")?.onPress();
      });

      expect(onSelectMax).toHaveBeenCalledTimes(1);
    });

    it("does not call onSelectMax when max is already active", () => {
      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, useAllAmount: true } as unknown as Transaction,
        }),
      );

      act(() => {
        result.current.find(a => a.id === "max")?.onPress();
      });

      expect(onSelectMax).not.toHaveBeenCalled();
    });

    it("does not call onSetAmountFromRatio when ratio is already active", () => {
      const quarterAmount = maxAvailable.multipliedBy(0.25).integerValue(BigNumber.ROUND_DOWN);

      const { result } = renderHook(() =>
        useQuickActions({
          ...defaultParams,
          transaction: { ...baseTransaction, amount: quarterAmount } as unknown as Transaction,
        }),
      );

      // Click quarter once to make it selected internally
      act(() => {
        result.current.find(a => a.id === "quarter")?.onPress();
      });

      onSetAmountFromRatio.mockClear();

      // Click again — should be a no-op since it's active
      act(() => {
        result.current.find(a => a.id === "quarter")?.onPress();
      });

      expect(onSetAmountFromRatio).not.toHaveBeenCalled();
    });
  });
});
