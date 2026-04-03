import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenAssetFlow } from "../useOpenAssetFlow";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

describe("useOpenAssetFlow", () => {
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
    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBe(true);
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
    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBe(true);
  });
});
