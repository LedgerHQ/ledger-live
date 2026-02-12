import { act, renderHook } from "@testing-library/react-native";
import { useAppLoadingManager } from "../useAppLoadingManager";
import { LoadingState, LoadingConfig } from "../../LoadingStates";
import SplashScreen from "react-native-splash-screen";
import { Animated } from "react-native";

type RenderHookProps = { isNavigationReady: boolean };

// Mock react-native-splash-screen
jest.mock("react-native-splash-screen", () => ({
  hide: jest.fn(),
}));

describe("useAppLoadingManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    jest.spyOn(Animated, "timing").mockImplementation((_value, config) => {
      const mockCompositeAnimation: Animated.CompositeAnimation = {
        start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
          const duration = config?.duration || 300;
          setTimeout(() => {
            callback?.({ finished: true });
          }, duration);
        }),
        stop: jest.fn(),
        reset: jest.fn(),
      };
      return mockCompositeAnimation;
    });

    jest.spyOn(Animated, "parallel").mockImplementation(_animations => {
      const mockCompositeAnimation: Animated.CompositeAnimation = {
        start: jest.fn((callback?: (result: { finished: boolean }) => void) => {
          const maxDuration = 300;
          setTimeout(() => {
            callback?.({ finished: true });
          }, maxDuration);
        }),
        stop: jest.fn(),
        reset: jest.fn(),
      };
      return mockCompositeAnimation;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("Case A: Navigation ready before mount (skip Lottie)", () => {
    it("should skip Lottie animation when navigation is ready from start", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 1000,
        lottieMaxDuration: 5000,
      };

      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: true,
          config,
          onAppReady,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.lottieStarted).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.appIsReady).toBe(true);
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
      expect(onAppReady).toHaveBeenCalledTimes(1);
    });

    it("should not start Lottie animation when navigation is ready", () => {
      const onAppReady = jest.fn();

      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: true,
          onAppReady,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.lottieStarted).toBe(false);
    });
  });

  describe("Case B: Navigation ready during animation (interrupt)", () => {
    it("should interrupt Lottie animation when navigation becomes ready after min duration", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 1000,
        lottieMaxDuration: 5000,
      };

      const { result, rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.lottieStarted).toBe(true);
      expect(SplashScreen.hide).toHaveBeenCalledTimes(1); // Called when Lottie starts

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.appIsReady).toBe(true);
      expect(SplashScreen.hide).toHaveBeenCalledTimes(2); // Called again during transition

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
      expect(onAppReady).toHaveBeenCalledTimes(1);
    });

    it("should wait for min duration before transitioning when navigation becomes ready early", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 2000,
        lottieMaxDuration: 5000,
      };

      const { result, rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.lottieStarted).toBe(true);
      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(1000); // Before min duration
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.appIsReady).toBe(false);
      expect(onAppReady).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.appIsReady).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
      expect(onAppReady).toHaveBeenCalledTimes(1);
    });
  });

  describe("Case C: Max duration fallback", () => {
    it("should not transition before navigation is ready even after max duration, and then transition once navigation becomes ready", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 1000,
        lottieMaxDuration: 3000,
      };

      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: false,
          config,
          onAppReady,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.lottieStarted).toBe(true);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);

      const { result: result2, rerender: rerender2 } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      rerender2({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result2.current.appIsReady).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result2.current.loadingState).toBe(LoadingState.APP_READY);
      expect(onAppReady).toHaveBeenCalledTimes(1);
    });

    it("should transition immediately when navigation becomes ready after max duration", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 1000,
        lottieMaxDuration: 2000,
      };

      const { result, rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.appIsReady).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
      expect(onAppReady).toHaveBeenCalledTimes(1);
    });
  });

  describe("SplashScreen.hide() calls", () => {
    it("should call SplashScreen.hide() when Lottie animation starts", () => {
      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: false,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
      expect(result.current.lottieStarted).toBe(true);
    });

    it("should call SplashScreen.hide() again during transition", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 0,
        lottieMaxDuration: 5000,
      };

      const { rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(SplashScreen.hide).toHaveBeenCalledTimes(2);
    });

    it("should call SplashScreen.hide() when navigation is ready from start", () => {
      renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: true,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    });
  });

  describe("State evolution", () => {
    it("should start in SPLASH state and transition to LOTTIE_LOADING", () => {
      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: false,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.lottieStarted).toBe(true);
    });

    it("should transition to APP_READY when conditions are met", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 0,
        lottieMaxDuration: 5000,
      };

      const { result, rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.appIsReady).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
    });

    it("should track lottieStarted correctly", () => {
      const { result } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.lottieStarted).toBe(true);

      const { result: result2 } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: true,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result2.current.lottieStarted).toBe(false);
    });
  });

  describe("onAppReady callback", () => {
    it("should call onAppReady when transition completes", () => {
      const onAppReady = jest.fn();
      const config: LoadingConfig = {
        lottieMinDuration: 0,
        lottieMaxDuration: 5000,
      };

      const { rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
            onAppReady,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onAppReady).toHaveBeenCalledTimes(1);
    });

    it("should not call onAppReady if not provided", () => {
      const config: LoadingConfig = {
        lottieMinDuration: 0,
        lottieMaxDuration: 5000,
      };

      const { result, rerender } = renderHook(
        ({ isNavigationReady }: RenderHookProps) =>
          useAppLoadingManager({
            isNavigationReady,
            config,
          }),
        {
          initialProps: { isNavigationReady: false },
        },
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);

      rerender({ isNavigationReady: true });

      act(() => {
        jest.advanceTimersByTime(0);
      });

      // Transition should start even without onAppReady callback
      expect(result.current.appIsReady).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.loadingState).toBe(LoadingState.APP_READY);
      expect(result.current.appIsReady).toBe(true);
    });
  });

  describe("Default config", () => {
    it("should use DEFAULT_LOADING_CONFIG when config is not provided", () => {
      const { result } = renderHook(() =>
        useAppLoadingManager({
          isNavigationReady: false,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.loadingState).toBe(LoadingState.LOTTIE_LOADING);
      expect(result.current.lottieStarted).toBe(true);
    });
  });
});
