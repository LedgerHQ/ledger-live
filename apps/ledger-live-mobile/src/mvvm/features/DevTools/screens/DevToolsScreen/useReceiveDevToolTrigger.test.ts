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

  it("opens the receive confirmation of the asset's token account with its parent", () => {
    const { result } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: usdcToken.id }));

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

  it("opens the receive confirmation of the main account for its coin", () => {
    const { result } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: "ethereum" }));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        parentId: undefined,
        currency: ethereum,
        accountId: ethAccount.id,
        hideBackButton: true,
      },
    });
  });

  it("opens nothing for an unknown account", () => {
    const { result } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: "unknown", assetId: "ethereum" }));

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
