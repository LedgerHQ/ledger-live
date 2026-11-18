import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { act, renderHook, waitFor } from "tests/testSetup";
import { getModalData, isModalOpened } from "~/renderer/reducers/modals";
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
  it("opens the receive modal on the token account of the asset, with its parent", async () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: usdcToken.id }));

    await waitFor(() =>
      expect(store.getState().modals.MODAL_RECEIVE).toEqual({
        isOpened: true,
        data: { account: usdcAccount, parentAccount: ethAccountWithToken, sourcePage: "DevTools" },
      }),
    );
  });

  it("opens the receive modal on the main account for its coin", async () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: "ethereum" }));

    await waitFor(() =>
      expect(getModalData(store.getState(), "MODAL_RECEIVE")).toEqual({
        account: ethAccountWithToken,
        sourcePage: "DevTools",
      }),
    );
  });

  it("closes an open receive modal before opening it on the new asset", async () => {
    const { result, store } = renderTrigger();
    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: "ethereum" }));
    await waitFor(() => expect(isModalOpened(store.getState(), "MODAL_RECEIVE")).toBe(true));

    act(() => result.current.onReceive({ legacyAccountId: ethAccount.id, assetId: usdcToken.id }));

    expect(isModalOpened(store.getState(), "MODAL_RECEIVE")).toBe(false);
    await waitFor(() =>
      expect(getModalData(store.getState(), "MODAL_RECEIVE")).toMatchObject({
        account: usdcAccount,
      }),
    );
  });

  it("opens nothing for an unknown account", () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onReceive({ legacyAccountId: "unknown", assetId: "ethereum" }));

    expect(store.getState().modals.MODAL_RECEIVE).toBeUndefined();
  });

  it("opens the receive modal on its account selection step", async () => {
    const { result, store } = renderTrigger();

    act(() => result.current.onPickAsset());

    await waitFor(() =>
      expect(store.getState().modals.MODAL_RECEIVE).toEqual({
        isOpened: true,
        data: { sourcePage: "DevTools" },
      }),
    );
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
