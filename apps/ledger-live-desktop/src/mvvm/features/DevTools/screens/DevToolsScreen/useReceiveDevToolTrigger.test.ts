import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "tests/testSetup";
import { getModalData } from "~/renderer/reducers/modals";
import { useReceiveDevToolTrigger } from "./useReceiveDevToolTrigger";

const ethAccount = genAccount("receive-devtool-eth", {
  currency: getCryptoCurrencyById("ethereum"),
  subAccountsCount: 0,
});
const usdcAccount = genTokenAccount(0, ethAccount, usdcToken);
const ethAccountWithToken: Account = { ...ethAccount, subAccounts: [usdcAccount] };

const renderTrigger = () =>
  renderHook(() => useReceiveDevToolTrigger(), {
    initialState: { accounts: [ethAccountWithToken] },
  });

describe("useReceiveDevToolTrigger", () => {
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

  it("opens the receive modal on a token account with its parent", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive(usdcAccount.id));

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: { account: usdcAccount, parentAccount: ethAccountWithToken, sourcePage: "DevTools" },
    });
  });

  it("opens the receive modal on an account without parent", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive(ethAccount.id));

    expect(getModalData(store.getState(), "MODAL_RECEIVE")).toEqual({
      account: ethAccountWithToken,
      parentAccount: undefined,
      sourcePage: "DevTools",
    });
  });

  it("opens nothing for an unknown account", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive("unknown"));

    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();
  });

  it("opens the receive modal on its account selection step", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onPickAsset());

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: { sourcePage: "DevTools" },
    });
  });

  it("runs the deeplink through the app's deeplink handler", async () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onOpenDeeplink("ledgerwallet://receive?currency=ethereum"));

    await waitFor(() =>
      expect(getModalData(store.getState(), "MODAL_RECEIVE")).toMatchObject({
        account: ethAccountWithToken,
        shouldUseReceiveOptions: false,
      }),
    );
  });
});
