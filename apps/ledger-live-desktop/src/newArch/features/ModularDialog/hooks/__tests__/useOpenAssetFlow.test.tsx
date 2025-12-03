import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import ModularDialogFlowManager from "../../ModularDialogFlowManager";
import { useOpenAssetFlowDialog } from "../useOpenAssetFlow";

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

describe("useOpenAssetFlowDialog", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const modularDrawerLocation = ModularDrawerLocation.ADD_ACCOUNT;

  it("should dispatch openModal if the modular drawer is not visible", async () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlowDialog({ location: modularDrawerLocation }, "test"),
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

    result.current.openAssetFlowDialog();

    expect(store.getState().modals.MODAL_ADD_ACCOUNTS).toEqual({
      isOpened: true,
      data: { newModalName: undefined },
    });
    expect(setDrawer).not.toHaveBeenCalled();
  });

  it("should open the modular drawer if it is visible and open the legacy modal once a currency is chosen and the lldNetworkBasedAddAccount flag is off", () => {
    const { result, store } = renderHook(
      () => useOpenAssetFlowDialog({ location: modularDrawerLocation }, "test"),
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
    result.current.openAssetFlowDialog();

    expect(setDrawer).toHaveBeenCalledTimes(1);
    expect(setDrawer).toHaveBeenLastCalledWith(
      ModularDialogFlowManager,
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

    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBeFalsy();

    // Select currency in the drawer
    const mockCurrency = { id: "btc", type: "CryptoCurrency" };
    selectAsset(mockCurrency);

    expect(setDrawer).toHaveBeenCalledTimes(2);
    expect(setDrawer).toHaveBeenCalledWith();

    expect(store.getState().modals.MODAL_ADD_ACCOUNTS).toEqual({
      isOpened: true,
      data: expect.objectContaining({ currency: mockCurrency }),
    });
  });
});
