import { act, renderHook } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { tickProductTourDeeplink } from "~/actions/appstate";
import {
  __resetProductTourAutoOpenForTests,
  useProductTourDrawerViewModel,
} from "./hooks/useProductTourDrawerViewModel";

const withNonce = (nonce: number) => (state: State) => ({
  ...state,
  appstate: { ...state.appstate, productTourDeeplinkNonce: nonce },
  settings: { ...state.settings, productTourCompleted: false },
  featureFlags: {
    ...state.featureFlags,
    overrides: { ...state.featureFlags.overrides, lwmProductTour: { enabled: true } },
  },
});

describe("useProductTourDrawerViewModel", () => {
  beforeEach(() => {
    __resetProductTourAutoOpenForTests();
  });

  it("should open the drawer when openProductTour is called", () => {
    const { result } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });

    act(() => {
      result.current.closeProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.openProductTour();
    });

    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      result.current.closeProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.openProductTour();
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("should close the drawer when closeProductTour is called", () => {
    const { result } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });
    act(() => {
      result.current.closeProductTour();
    });

    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("should open the drawer when productTourDeeplinkNonce increments from dispatch", () => {
    const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });

    act(() => {
      result.current.closeProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      store.dispatch(tickProductTourDeeplink());
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("should not open the drawer while productTourDeeplinkNonce is 0", () => {
    const { result } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });

    act(() => {
      result.current.closeProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("should allow openProductTour after closeProductTour", () => {
    const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });

    act(() => {
      store.dispatch(tickProductTourDeeplink());
    });
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      result.current.closeProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.openProductTour();
    });
    expect(result.current.isDrawerOpen).toBe(true);
  });

  it("should open again when nonce increments after a previous tick was handled", () => {
    const { result, store } = renderHook(() => useProductTourDrawerViewModel(), {
      overrideInitialState: withNonce(0),
    });

    act(() => {
      store.dispatch(tickProductTourDeeplink());
    });
    expect(result.current.isDrawerOpen).toBe(true);

    act(() => {
      result.current.closeProductTour();
    });

    act(() => {
      store.dispatch(tickProductTourDeeplink());
    });

    expect(result.current.isDrawerOpen).toBe(true);
  });
});
