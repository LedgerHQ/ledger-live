import { renderHook, act } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import useSelectAddAccountMethodViewModel from "../useSelectAddAccountMethodViewModel";

const openDrawer = jest.fn();

jest.mock("~/analytics", () => ({ track: jest.fn() }));

jest.mock("LLM/features/ModularDrawer", () => ({
  useModularDrawerController: () => ({ openDrawer }),
}));

const stateWithFlags = (walletSyncEnabled: boolean, readOnly = false) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: readOnly,
      overriddenFeatureFlags: {
        llmWalletSync: { enabled: walletSyncEnabled },
      },
    },
  }),
});

describe("useSelectAddAccountMethodViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return isWalletSyncEnabled=true when flag enabled", () => {
    const { result } = renderHook(
      () => useSelectAddAccountMethodViewModel({}),
      stateWithFlags(true),
    );

    expect(result.current.isWalletSyncEnabled).toBe(true);
  });

  it("should return isWalletSyncEnabled=false when flag disabled", () => {
    const { result } = renderHook(
      () => useSelectAddAccountMethodViewModel({}),
      stateWithFlags(false),
    );

    expect(result.current.isWalletSyncEnabled).toBe(false);
  });

  it("should call openDrawer with currency filter when currency provided", () => {
    const currency = { id: "ethereum", type: "CryptoCurrency" } as const;
    const onCloseAddAccountDrawer = jest.fn();

    const { result } = renderHook(
      () =>
        useSelectAddAccountMethodViewModel({
          currency: currency as never,
          onCloseAddAccountDrawer,
        }),
      stateWithFlags(false),
    );

    act(() => result.current.handleAddAccount());

    expect(onCloseAddAccountDrawer).toHaveBeenCalled();
    expect(openDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: ["ethereum"],
        areCurrenciesFiltered: true,
        enableAccountSelection: false,
        flow: "add_account",
      }),
    );
  });

  it("should call openDrawer without currency filter when no currency", () => {
    const onCloseAddAccountDrawer = jest.fn();

    const { result } = renderHook(
      () =>
        useSelectAddAccountMethodViewModel({
          onCloseAddAccountDrawer,
        }),
      stateWithFlags(false),
    );

    act(() => result.current.handleAddAccount());

    expect(openDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        currencies: undefined,
        areCurrenciesFiltered: false,
      }),
    );
  });

  it("should call onShowWalletSyncDrawer when handleWalletSync called", () => {
    const onShowWalletSyncDrawer = jest.fn();

    const { result } = renderHook(
      () =>
        useSelectAddAccountMethodViewModel({
          onShowWalletSyncDrawer,
        }),
      stateWithFlags(true),
    );

    act(() => result.current.handleWalletSync());

    expect(onShowWalletSyncDrawer).toHaveBeenCalled();
  });

  it("should call onCloseAddAccountDrawer before opening modular drawer", () => {
    const callOrder: string[] = [];
    const onCloseAddAccountDrawer = jest.fn(() => callOrder.push("close"));
    openDrawer.mockImplementation(() => callOrder.push("openDrawer"));

    const { result } = renderHook(
      () =>
        useSelectAddAccountMethodViewModel({
          onCloseAddAccountDrawer,
        }),
      stateWithFlags(false),
    );

    act(() => result.current.handleAddAccount());

    expect(callOrder).toEqual(["close", "openDrawer"]);
  });
});
