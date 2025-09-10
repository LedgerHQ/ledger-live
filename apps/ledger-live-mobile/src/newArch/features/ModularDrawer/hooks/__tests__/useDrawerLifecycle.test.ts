import { renderHook, act } from "@tests/test-renderer";
import { useDrawerLifecycle } from "../useDrawerLifecycle";
import { ModularDrawerStep } from "../../types";
import { State } from "~/reducers/types";

jest.mock("../../analytics/useModularDrawerAnalytics", () => ({
  useModularDrawerAnalytics: () => ({
    trackModularDrawerEvent: jest.fn(),
  }),
  getCurrentPageName: () => "page",
}));

describe("useDrawerLifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("back button prefers network when available, else asset", () => {
    const backToAsset = jest.fn();
    const backToNetwork = jest.fn();
    const { result } = renderHook(
      () =>
        useDrawerLifecycle({
          canGoBackToAsset: true,
          canGoBackToNetwork: true,
          backToAsset,
          backToNetwork,
          resetSelection: jest.fn(),
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, step: ModularDrawerStep.Account },
        }),
      },
    );

    act(() => result.current.handleBackButton());
    expect(backToNetwork).toHaveBeenCalled();

    const result2 = renderHook(
      () =>
        useDrawerLifecycle({
          canGoBackToAsset: true,
          canGoBackToNetwork: false,
          backToAsset,
          backToNetwork,
          resetSelection: jest.fn(),
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, step: ModularDrawerStep.Account },
        }),
      },
    );
    act(() => result2.result.current.handleBackButton());
    expect(backToAsset).toHaveBeenCalled();
  });

  it("close button resets and calls onClose", () => {
    const onClose = jest.fn();
    const resetSelection = jest.fn();
    const { result, store } = renderHook(
      () =>
        useDrawerLifecycle({
          canGoBackToAsset: false,
          canGoBackToNetwork: false,
          backToAsset: jest.fn(),
          backToNetwork: jest.fn(),
          onClose,
          resetSelection,
        }),
      {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: { ...state.modularDrawer, step: ModularDrawerStep.Network },
        }),
      },
    );

    act(() => result.current.handleCloseButton());
    expect(resetSelection).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(store.getState().modularDrawer.step).toBe(ModularDrawerStep.Asset);
  });
});
