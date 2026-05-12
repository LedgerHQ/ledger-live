import { renderHook, act } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import { useTransactionsViewModel, MAX_PREVIEW_OPERATIONS } from "../useTransactionsViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function withAccounts(currencyId: string, count: number, operationsSize = 0) {
  const currency = currencyId === "bitcoin" ? mockBtcCryptoCurrency : mockEthCryptoCurrency;
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: Array.from({ length: count }, (_, i) =>
          genAccount(`${currencyId}-${i}`, { currency, operationsSize }),
        ),
      },
    }),
  };
}

describe("useTransactionsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("operations", () => {
    it.each([
      { scenario: "currency is undefined", currency: undefined, accounts: undefined },
      { scenario: "there are no accounts", currency: mockBtcCryptoCurrency, accounts: undefined },
      { scenario: "accounts have no operations", currency: mockBtcCryptoCurrency, accounts: withAccounts("bitcoin", 2, 0) },
    ])("returns an empty array when $scenario", ({ currency, accounts }) => {
      const { result } = renderHook(() => useTransactionsViewModel(currency), accounts);

      expect(result.current.operations).toEqual([]);
    });

    it("returns operations when accounts have them", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1, 10),
      );

      expect(result.current.operations.length).toBeGreaterThan(0);
      expect(result.current.operations.length).toBeLessThanOrEqual(MAX_PREVIEW_OPERATIONS);
    });

    it("limits operations to MAX_PREVIEW_OPERATIONS", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 2, 20),
      );

      expect(result.current.operations.length).toBeLessThanOrEqual(MAX_PREVIEW_OPERATIONS);
    });

    it("returns no operations for a non-matching currency", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("ethereum", 1, 10),
      );

      expect(result.current.operations).toEqual([]);
    });
  });

  describe("accountByAddress", () => {
    it("builds a map keyed by currencyId:freshAddress", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 2, 1),
      );

      expect(result.current.accountByAddress).toBeInstanceOf(Map);
      expect(result.current.accountByAddress.size).toBeGreaterThan(0);
    });

    it("returns an empty map when there are no accounts", () => {
      const { result } = renderHook(() => useTransactionsViewModel(undefined));

      expect(result.current.accountByAddress.size).toBe(0);
    });
  });

  describe("onHeaderPress", () => {
    it("navigates to filtered OperationsHistory and fires analytics", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1, 5),
      );

      act(() => result.current.onHeaderPress());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.OperationsHistory, {
        screen: ScreenName.OperationsList,
        params: { currencyId: "bitcoin" },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "transactions_header",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });
  });

  describe("findAccount", () => {
    it("resolves an account by operation accountId", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1, 5),
      );

      const op = result.current.operations[0];
      if (!op) return;

      const resolved = result.current.findAccount(op.accountId);
      expect(resolved).not.toBeNull();
      expect(resolved?.account.id).toBe(op.accountId);
    });

    it("returns null for an unknown accountId", () => {
      const { result } = renderHook(
        () => useTransactionsViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1, 5),
      );

      expect(result.current.findAccount("unknown-id")).toBeNull();
    });
  });
});
