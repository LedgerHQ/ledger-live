import React from "react";
import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useOpenAssetFlow } from "../useOpenAssetFlow";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { setDrawer } from "~/renderer/drawers/Provider";

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
});
