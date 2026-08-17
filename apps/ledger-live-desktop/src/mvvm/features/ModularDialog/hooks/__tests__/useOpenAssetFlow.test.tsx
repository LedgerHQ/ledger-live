import React from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenAssetFlow } from "../useOpenAssetFlow";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { setDrawer } from "~/renderer/drawers/Provider";

type OnAccountSelected = (account: AccountLike, parentAccount?: Account) => void;

const getLastOnAccountSelected = (): OnAccountSelected => {
  const lastCall = jest.mocked(setDrawer).mock.calls.at(-1);
  const props = lastCall?.[1] as { onAccountSelected?: OnAccountSelected } | undefined;
  if (!props?.onAccountSelected) {
    throw new Error("setDrawer was not called with an onAccountSelected callback");
  }
  return props.onAccountSelected;
};

const MODULAR_DRAWER_ENABLED = withFlagOverrides({
  lldModularDrawer: {
    enabled: true,
    params: {
      [ModularDrawerLocation.ADD_ACCOUNT]: true,
    },
  },
});

jest.mock("~/renderer/drawers/Provider", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  setDrawer: jest.fn(),
}));

describe("useOpenAssetFlow", () => {
  beforeEach(() => {
    jest.mocked(setDrawer).mockClear();
  });

  it("should handle openAssetFlow", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlow({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: withFlagOverrides({
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
            },
          },
        }),
      },
    );

    result.current.openAssetFlow();

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.flow).toBe(ModularDrawerLocation.LIVE_APP);
    expect(store.getState().modularDialog.source).toBe("test");
    expect(store.getState().modularDialog.dialogParams?.currencies?.length).toBe(0);
  });

  it("should open the dialog filtered to the provided network currency ids", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlow({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: withFlagOverrides({
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
            },
          },
        }),
      },
    );

    result.current.openAssetFlow(undefined, ["ethereum", "base", "arbitrum"]);

    expect(store.getState().modularDialog.isOpen).toBe(true);
    expect(store.getState().modularDialog.dialogParams?.currencies).toEqual([
      "ethereum",
      "base",
      "arbitrum",
    ]);
    expect(store.getState().modularDialog.dialogParams?.areCurrenciesFiltered).toBe(true);
  });

  it("should handle openAssetFlow to accountFlow", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlow({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: withFlagOverrides({
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
            },
          },
        }),
      },
    );

    result.current.openAssetFlow();

    expect(store.getState().modularDialog.isOpen).toBe(true);

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));

    expect(store.getState().modularDialog.isOpen).toBe(false);
    expect(setDrawer).toHaveBeenCalledTimes(1);
  });

  it("should handle openAddAccountFlow", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlow({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: withFlagOverrides({
          lldModularDrawer: {
            enabled: true,
            params: {
              [ModularDrawerLocation.LIVE_APP]: true,
            },
          },
        }),
      },
    );

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));

    expect(store.getState().modularDialog.isOpen).toBe(false);
    expect(setDrawer).toHaveBeenCalledTimes(1);
  });

  it("reopens the modal with the extra modal data when the account flow finishes", () => {
    const { result, store } = renderHook(
      () =>
        useOpenAssetFlow({ location: ModularDrawerLocation.ADD_ACCOUNT }, "Pay", "MODAL_RECEIVE", {
          shouldUseReceiveOptions: false,
        }),
      { initialState: MODULAR_DRAWER_ENABLED },
    );

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));
    getLastOnAccountSelected()(BTC_ACCOUNT);

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: {
        account: BTC_ACCOUNT,
        parentAccount: undefined,
        shouldUseReceiveOptions: false,
      },
    });
  });

  it("reopens the modal without extra data when none is provided", () => {
    const { result, store } = renderHook(
      () =>
        useOpenAssetFlow(
          { location: ModularDrawerLocation.ADD_ACCOUNT },
          "receive",
          "MODAL_RECEIVE",
        ),
      { initialState: MODULAR_DRAWER_ENABLED },
    );

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));
    getLastOnAccountSelected()(BTC_ACCOUNT);

    expect(store.getState().modals.MODAL_RECEIVE).toEqual({
      isOpened: true,
      data: {
        account: BTC_ACCOUNT,
        parentAccount: undefined,
      },
    });
  });
});
