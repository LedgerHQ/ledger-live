import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { LoadingConfig, LoadingState, DEFAULT_LOADING_CONFIG } from "../LoadingStates";

type UseAppLoadingManagerParams = {
  isNavigationReady: boolean;
  config?: LoadingConfig;
  onAppReady?: () => void;
};

/**
 * Hook to manage the loading state of the app. It handles the Lottie animation
 * and the transition to the app content. The transition from splash / Lottie to
 * the app content happens when one of the following conditions is met:
 *
 * A. Navigation is ready before the Lottie animation starts: skip the Lottie animation.
 * B. Navigation becomes ready while the Lottie animation is visible and the minimum
 *    display time has elapsed: interrupt and fade out immediately.
 * C. Navigation is not ready until after the maximum waiting time: transition as soon
 *    as navigation becomes ready and the maximum time has elapsed.
 *
 * @param isNavigationReady
 * Whether the navigation is ready
 *
 * @param config
 * The configuration for the loading manager
 *
 * @param onAppReady
 * The callback to call when the app is ready
 */
export function useAppLoadingManager({
  isNavigationReady,
  config = DEFAULT_LOADING_CONFIG,
  onAppReady,
}: UseAppLoadingManagerParams) {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SPLASH);
  const [lottieStartTime, setLottieStartTime] = useState<number | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [maxTimeElapsed, setMaxTimeElapsed] = useState(false);
  const [lottieStarted, setLottieStarted] = useState(false);

  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const hasTransitionedRef = useRef(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    setLoadingState(LoadingState.LOTTIE_LOADING);
    setLottieStartTime(Date.now());

    // Handles case A from the above description
    if (!isNavigationReady) {
      setLottieStarted(true);
      SplashScreen.hide();
      Animated.timing(lottieOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [lottieOpacity, isNavigationReady]);

  useEffect(() => {
    if (loadingState !== LoadingState.LOTTIE_LOADING || !lottieStartTime) return;

    setMinTimeElapsed(false);
    setMaxTimeElapsed(false);
    hasTransitionedRef.current = false;

    const minDuration = config.lottieMinDuration || 0;
    const maxDuration = config.lottieMaxDuration;

    let minTimer: ReturnType<typeof setTimeout> | null = null;
    let maxTimer: ReturnType<typeof setTimeout> | null = null;

    if (minDuration > 0) {
      minTimer = setTimeout(() => setMinTimeElapsed(true), minDuration);
    } else {
      setMinTimeElapsed(true);
    }

    if (typeof maxDuration === "number" && isFinite(maxDuration)) {
      maxTimer = setTimeout(() => setMaxTimeElapsed(true), maxDuration);
    }

    return () => {
      if (minTimer) clearTimeout(minTimer);
      if (maxTimer) clearTimeout(maxTimer);
    };
  }, [loadingState, lottieStartTime, config]);

  useEffect(() => {
    if (loadingState !== LoadingState.LOTTIE_LOADING) return;

    // Handles case B and C from the above description
    const canTransition = isNavigationReady && (minTimeElapsed || maxTimeElapsed);
    if (!canTransition || hasTransitionedRef.current) return;

    hasTransitionedRef.current = true;
    setAppIsReady(true);

    // Hide native splash screen right before starting fade animation
    // This ensures native splash fades out onto React content screen
    // (e.g. portfolio/onboarding) that's already rendered. The React
    // content is rendered but opacity is 0, so it's ready to fade in
    // smoothly
    SplashScreen.hide();

    const animations = [
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }),
    ];

    if (lottieStarted) {
      animations.push(
        Animated.timing(lottieOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }

    Animated.parallel(animations).start(() => {
      setLoadingState(LoadingState.APP_READY);
      onAppReady?.();
    });
  }, [
    loadingState,
    isNavigationReady,
    minTimeElapsed,
    maxTimeElapsed,
    lottieStarted,
    onAppReady,
    lottieOpacity,
    appOpacity,
  ]);

  return {
    loadingState,
    appIsReady,
    appOpacity,
    lottieOpacity,
    lottieStarted,
  };
}
