import { Linking } from "react-native";
import { act } from "@testing-library/react-native";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { renderHook } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useReceiveDevToolTrigger } from "./useReceiveDevToolTrigger";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const ethAccount = genAccount("receive-devtool-eth", { currency: ethereum, subAccountsCount: 0 });
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const ethAccountWithToken: Account = { ...ethAccount, subAccounts: [usdcAccount] };

const renderTrigger = () =>
  renderHook(() => useReceiveDevToolTrigger(), {
    overrideInitialState: state => ({
      ...state,
      accounts: { ...state.accounts, active: [ethAccountWithToken] },
    }),
  });

describe("useReceiveDevToolTrigger", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists every account and token account, a token with its network badge", () => {
    const { result } = renderTrigger();

    expect(result.current.assets).toEqual([
      {
        id: ethAccount.id,
        label: `Ethereum ${ethAccount.index + 1}`,
        ticker: "ETH",
        currencyId: "ethereum",
        network: "Ethereum",
        networkId: undefined,
      },
      {
        id: usdcAccount.id,
        label: usdcToken.name,
        ticker: usdcToken.ticker,
        currencyId: usdcToken.id,
        network: "Ethereum",
        networkId: "ethereum",
      },
    ]);
  });

  it("opens the receive confirmation of a token account with its parent", () => {
    const { result } = renderTrigger();

    act(() => result.current.onReceive(usdcAccount.id));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        parentId: ethAccount.id,
        currency: usdcToken,
        accountId: ethAccount.id,
        hideBackButton: true,
      },
    });
  });

  it("opens nothing for an unknown account", () => {
    const { result } = renderTrigger();

    act(() => result.current.onReceive("unknown"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("opens the receive asset selection drawer", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onPickAsset());

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      enableAccountSelection: true,
    });
  });

  it("opens the deeplink as the OS would", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { result } = renderTrigger();

    act(() => result.current.onOpenDeeplink("ledgerwallet://receive?currency=ethereum"));

    expect(openURL).toHaveBeenCalledWith("ledgerwallet://receive?currency=ethereum");
  });
});
