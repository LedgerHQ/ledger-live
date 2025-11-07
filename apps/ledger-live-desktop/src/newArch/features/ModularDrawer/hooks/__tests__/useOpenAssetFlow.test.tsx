import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import ModularDrawerFlowManager from "../../ModularDrawerFlowManager";
import { useOpenAssetFlow } from "../useOpenAssetFlow";

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

describe("useOpenAssetFlow", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const modularDrawerLocation = ModularDrawerLocation.ADD_ACCOUNT;

  it("should open the drawer even if the modular drawer feature flag is disabled", async () => {
    const { result } = renderHook(
      () => useOpenAssetFlow({ location: modularDrawerLocation }, "test"),
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lldModularDrawer: {
                enabled: false,
              },
            },
          },
        },
      },
    );

    result.current.openAssetFlow();

    expect(setDrawer).toHaveBeenCalled();
  });

  it("should open the modular drawer if it is visible and open the legacy modal once a currency is chosen and the lldNetworkBasedAddAccount flag is off", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlow({ location: modularDrawerLocation }, "test"),
      {
        initialState: {
          settings: {
            overriddenFeatureFlags: {
              lldNetworkBasedAddAccount: {
                enabled: false,
              },
              lldModularDrawer: {
                enabled: true,
                params: {
                  [ModularDrawerLocation.ADD_ACCOUNT]: true,
                },
              },
            },
          },
        },
      },
    );

    const selectAsset = jest.fn();
    (setDrawer as jest.Mock).mockImplementation((_, props) =>
      selectAsset.mockImplementation(props?.onAssetSelected),
    );

    // Should open the drawer
    result.current.openAssetFlow();

    expect(setDrawer).toHaveBeenCalledTimes(1);
    expect(setDrawer).toHaveBeenLastCalledWith(
      ModularDrawerFlowManager,
      {
        currencies: [],
        drawerConfiguration: {
          assets: { leftElement: "undefined", rightElement: "balance" },
          networks: { leftElement: "numberOfAccounts", rightElement: "balance" },
        },
        onAssetSelected: expect.any(Function),
      },
      {
        closeButtonComponent: expect.any(Function),
        onRequestClose: expect.any(Function),
      },
    );

    // Select currency in the drawer
    const mockCurrency = { id: "btc", type: "CryptoCurrency" };
    selectAsset(mockCurrency);

    // Should open the add account flow drawer
    expect(setDrawer).toHaveBeenCalledTimes(2);
  });
});
