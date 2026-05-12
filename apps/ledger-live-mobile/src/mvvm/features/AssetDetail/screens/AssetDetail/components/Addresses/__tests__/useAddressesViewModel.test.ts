import { renderHook, act } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import type { State } from "~/reducers/types";
import { useAddressesViewModel } from "../useAddressesViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function withAccounts(currencyId: string, count: number) {
  const currency = currencyId === "bitcoin" ? mockBtcCryptoCurrency : mockEthCryptoCurrency;
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: Array.from({ length: count }, (_, i) =>
          genAccount(`${currencyId}-${i}`, { currency, operationsSize: 0 }),
        ),
      },
    }),
  };
}

describe("useAddressesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("accounts", () => {
    it("returns an empty array when currency is undefined", () => {
      const { result } = renderHook(() => useAddressesViewModel(undefined));

      expect(result.current.accounts).toEqual([]);
    });

    it("returns accounts matching the currency", () => {
      const { result } = renderHook(
        () => useAddressesViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 2),
      );

      expect(result.current.accounts).toHaveLength(2);
      result.current.accounts.forEach(acc => {
        expect(acc.name).toBeDefined();
        expect(acc.truncatedAddress).toBeDefined();
        expect(acc.account).toBeDefined();
      });
    });

    it("returns no accounts when none match the currency", () => {
      const { result } = renderHook(
        () => useAddressesViewModel(mockBtcCryptoCurrency),
        withAccounts("ethereum", 2),
      );

      expect(result.current.accounts).toHaveLength(0);
    });
  });

  describe("onAddAccount", () => {
    it("navigates to device selection and fires analytics", () => {
      const { result } = renderHook(
        () => useAddressesViewModel(mockBtcCryptoCurrency),
        withAccounts("bitcoin", 1),
      );

      act(() => result.current.onAddAccount());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: mockBtcCryptoCurrency,
          context: AddAccountContexts.AddAccounts,
        },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "add_account",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("does nothing when currency is undefined", () => {
      const { result } = renderHook(() => useAddressesViewModel(undefined));

      act(() => result.current.onAddAccount());

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(track).not.toHaveBeenCalled();
    });

    it("navigates with parentCurrency when currency is a token", () => {
      const { result } = renderHook(() => useAddressesViewModel(usdcToken));

      act(() => result.current.onAddAccount());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: mockEthCryptoCurrency,
          context: AddAccountContexts.AddAccounts,
        },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "add_account",
        currency: usdcToken.id,
        page: "Asset Detail",
      });
    });
  });
});
