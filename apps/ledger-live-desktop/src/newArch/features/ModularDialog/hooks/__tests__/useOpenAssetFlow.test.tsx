import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook } from "tests/testSetup";
import { useOpenAssetFlowDialog } from "../useOpenAssetFlow";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/lib-es/currencies";

describe("useOpenAssetFlowDialog", () => {
  it("should handle openAssetFlowDialog", () => {
    const { result, store } = renderHook(
      () =>
        useOpenAssetFlowDialog({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lldModularDrawer: {
                enabled: true,
                params: {
                  [ModularDrawerLocation.LIVE_APP]: true,
                },
              },
            },
          },
        },
      },
    );

    result.current.openAssetFlowDialog();

    expect(store.getState().modularDrawer.isOpen).toBe(true);
    expect(store.getState().modularDrawer.flow).toBe(ModularDrawerLocation.LIVE_APP);
    expect(store.getState().modularDrawer.source).toBe("test");
    expect(store.getState().modularDrawer.dialogParams?.currencies?.length).toBe(0);
  });

  it("should handle openAssetFlowDialog to accountFlow", () => {
    const { result, store } = renderHook(
      () =>
        useOpenAssetFlowDialog({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lldModularDrawer: {
                enabled: true,
                params: {
                  [ModularDrawerLocation.LIVE_APP]: true,
                },
              },
            },
          },
        },
      },
    );

    result.current.openAssetFlowDialog();

    expect(store.getState().modularDrawer.isOpen).toBe(true);

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));

    expect(store.getState().modularDrawer.isOpen).toBe(false);
    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBe(true);
  });

  it("should handle openAddAccountFlow", () => {
    const { result, store } = renderHook(
      () =>
        useOpenAssetFlowDialog({ location: ModularDrawerLocation.LIVE_APP, liveAppId: "" }, "test"),
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lldModularDrawer: {
                enabled: true,
                params: {
                  [ModularDrawerLocation.LIVE_APP]: true,
                },
              },
            },
          },
        },
      },
    );

    result.current.openAddAccountFlow(getCryptoCurrencyById("bitcoin"));

    expect(store.getState().modularDrawer.isOpen).toBe(false);
    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBe(true);
  });
});
