import { renderHook, act } from "@tests/test-renderer";
import { useModularDrawer } from "../useModularDrawer";
import { ModularDrawerStep } from "../../types";
import { State } from "~/reducers/types";
import { INITIAL_STATE } from "~/reducers/modularDrawer";
import { mockEthCryptoCurrency, mockBtcCryptoCurrency } from "../../__mocks__/currencies.mock";

describe("useModularDrawer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("State selectors", () => {
    it("should return current step from selector", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            currentStep: ModularDrawerStep.Asset,
          },
        }),
      });
      expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    });

    it("should return selected asset from selector", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            selectedAsset: mockEthCryptoCurrency,
          },
        }),
      });
      expect(result.current.selectedAsset).toBe(mockEthCryptoCurrency);
    });

    it("should return selected network from selector", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            selectedNetwork: mockBtcCryptoCurrency,
          },
        }),
      });
      expect(result.current.selectedNetwork).toBe(mockBtcCryptoCurrency);
    });

    it("should return drawer open state from selector", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            isDrawerOpen: true,
          },
        }),
      });
      expect(result.current.isDrawerOpen).toBe(true);
    });
  });

  describe("hasBackButton", () => {
    it("should return false when current step is Asset", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            currentStep: ModularDrawerStep.Asset,
          },
        }),
      });
      expect(result.current.hasBackButton).toBe(false);
    });

    it("should return true when current step is not Asset", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
            currentStep: ModularDrawerStep.Network,
          },
        }),
      });
      expect(result.current.hasBackButton).toBe(true);
    });
  });

  describe("setStep", () => {
    it("should dispatch setModularDrawerStep action", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.setStep(ModularDrawerStep.Network);
      });

      expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    });
  });

  describe("setSelectedAsset", () => {
    it("should dispatch setModularDrawerSelectedAsset action", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.setSelectedAsset(mockEthCryptoCurrency);
      });

      expect(result.current.selectedAsset).toBe(mockEthCryptoCurrency);
    });
  });

  describe("setSelectedNetwork", () => {
    it("should dispatch setModularDrawerSelectedNetwork action", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.setSelectedNetwork(mockBtcCryptoCurrency);
      });

      expect(result.current.selectedNetwork).toBe(mockBtcCryptoCurrency);
    });
  });

  describe("openDrawer", () => {
    it("should dispatch setModularDrawerOpen action with true", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.openDrawer();
      });

      expect(result.current.isDrawerOpen).toBeTruthy();
    });
  });

  describe("closeDrawer", () => {
    it("should dispatch setModularDrawerOpen action with false", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.closeDrawer();
      });

      expect(result.current.isDrawerOpen).toBeFalsy();
    });
  });

  describe("initDrawer", () => {
    it("should initialize drawer with provided parameters and open it", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.initDrawer(
          mockEthCryptoCurrency,
          mockBtcCryptoCurrency,
          ModularDrawerStep.Network,
        );
      });

      expect(result.current.isDrawerOpen).toBeTruthy();
      expect(result.current.selectedAsset).toBe(mockEthCryptoCurrency);
      expect(result.current.selectedNetwork).toBe(mockBtcCryptoCurrency);
      expect(result.current.currentStep).toBe(ModularDrawerStep.Network);
    });

    it("should use default values when parameters are not provided", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.initDrawer();
      });

      expect(result.current.isDrawerOpen).toBeTruthy();
      expect(result.current.selectedAsset).toBeNull();
      expect(result.current.selectedNetwork).toBeNull();
      expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    });

    it("should handle partial parameters", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.initDrawer(mockEthCryptoCurrency, undefined, ModularDrawerStep.Account);
      });

      expect(result.current.isDrawerOpen).toBeTruthy();
      expect(result.current.selectedAsset).toBe(mockEthCryptoCurrency);
      expect(result.current.selectedNetwork).toBeNull();
      expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    });
  });

  describe("resetState", () => {
    it("should reset all state to initial values", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.resetState();
      });

      expect(result.current.isDrawerOpen).toBeFalsy();
      expect(result.current.selectedAsset).toBeNull();
      expect(result.current.selectedNetwork).toBeNull();
      expect(result.current.currentStep).toBe(ModularDrawerStep.Asset);
    });
  });

  describe("goToStep", () => {
    it("should call setStep with the provided step", () => {
      const { result } = renderHook(() => useModularDrawer(), {
        overrideInitialState: (state: State) => ({
          ...state,
          modularDrawer: {
            ...INITIAL_STATE,
          },
        }),
      });

      act(() => {
        result.current.goToStep(ModularDrawerStep.Account);
      });

      expect(result.current.currentStep).toBe(ModularDrawerStep.Account);
    });
  });
});
