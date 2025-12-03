import { ModularDrawerLocation } from "@ledgerhq/live-common/modularDrawer/enums";
import { renderHook } from "tests/testSetup";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useOpenAssetFlowDialog } from "../useOpenAssetFlow";

jest.mock("~/renderer/drawers/Provider", () => ({
  setDrawer: jest.fn(),
}));

const mockOpenDialog = jest.fn();
const mockCloseDialog = jest.fn();

jest.mock("LLD/components/Dialog", () => ({
  useDialog: jest.fn(() => ({
    openDialog: mockOpenDialog,
    closeDialog: mockCloseDialog,
  })),
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

    let onAssetSelectedHandler: ((currency: unknown) => void) | undefined;

    mockOpenDialog.mockImplementation((content: React.ReactNode) => {
      // @ts-expect-error - accessing props from React element in test
      const dialogProps = content?.props;
      onAssetSelectedHandler = dialogProps?.onAssetSelected;
    });

    // Should open the dialog
    result.current.openAssetFlowDialog();

    expect(mockOpenDialog).toHaveBeenCalledTimes(1);
    const call = mockOpenDialog.mock.calls[0];
    const dialogProps = call[0].props;

    expect(dialogProps).toMatchObject({
      currencies: [],
      drawerConfiguration: {
        assets: { leftElement: "undefined", rightElement: "balance" },
        networks: { leftElement: "numberOfAccounts", rightElement: "balance" },
      },
    });
    expect(dialogProps.onAssetSelected).toBeDefined();

    expect(store.getState().modals.MODAL_ADD_ACCOUNTS?.isOpened).toBeFalsy();

    // Select currency in the dialog
    const mockCurrency = {
      id: "btc",
      type: "CryptoCurrency",
    };
    if (onAssetSelectedHandler) {
      onAssetSelectedHandler(mockCurrency);
    }

    expect(store.getState().modals.MODAL_ADD_ACCOUNTS).toEqual({
      isOpened: true,
      data: expect.objectContaining({ currency: mockCurrency }),
    });
  });
});
