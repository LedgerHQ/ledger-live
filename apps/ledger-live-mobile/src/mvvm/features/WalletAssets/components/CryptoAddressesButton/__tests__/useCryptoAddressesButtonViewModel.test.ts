import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";
import { useCryptoAddressesButtonViewModel } from "../useCryptoAddressesButtonViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const btcAccount = genAccount("btc1", { currency: bitcoin });
const ethAccount = genAccount("eth1", { currency: ethereum });
const btcAccount2 = genAccount("btc2", { currency: bitcoin });

const withAccounts =
  (accounts: object[], extraFlags: object = {}) =>
  (state: State): State => ({
    ...state,
    accounts: { active: accounts as State["accounts"]["active"] },
    settings: {
      ...state.settings,
      overriddenFeatureFlags: {
        ...state.settings.overriddenFeatureFlags,
        ...extraFlags,
      },
    },
  });

describe("useCryptoAddressesButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("accountsCount", () => {
    it("should return the number of accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount]),
      });

      expect(result.current.accountsCount).toBe(2);
    });

    it("should return 0 when there are no accounts", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([]),
      });

      expect(result.current.accountsCount).toBe(0);
    });
  });

  describe("firstThreeCurrencies", () => {
    it("should deduplicate currencies across accounts of the same type", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, btcAccount2, ethAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(2);
      expect(result.current.firstThreeCurrencies[0]).toBe(bitcoin);
      expect(result.current.firstThreeCurrencies[1]).toBe(ethereum);
    });

    it("should cap at 3 currencies", () => {
      const solana = getCryptoCurrencyById("solana");
      const solAccount = genAccount("sol1", { currency: solana });
      const xrpCurrency = getCryptoCurrencyById("ripple");
      const xrpAccount = genAccount("xrp1", { currency: xrpCurrency });

      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount, ethAccount, solAccount, xrpAccount]),
      });

      expect(result.current.firstThreeCurrencies).toHaveLength(3);
    });
  });

  describe("onPress — navigation", () => {
    it("should navigate to AssetsList", () => {
      const { result } = renderHook(() => useCryptoAddressesButtonViewModel(), {
        overrideInitialState: withAccounts([btcAccount]),
      });

      act(() => {
        result.current.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Assets, {
        screen: ScreenName.AssetsList,
        params: {
          sourceScreenName: ScreenName.Portfolio,
          showHeader: true,
          isSyncEnabled: true,
        },
      });
    });
  });
});
