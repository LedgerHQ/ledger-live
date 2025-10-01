import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { LoadingConfig, LoadingState, DEFAULT_LOADING_CONFIG } from "../LoadingStates";

type UseAppLoadingManagerParams = {
  isNavigationReady: boolean;
  config?: LoadingConfig;
  onAppReady?: () => void;
};

export function useAppLoadingManager({
  isNavigationReady,
  config = DEFAULT_LOADING_CONFIG,
  onAppReady,
}: UseAppLoadingManagerParams) {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.SPLASH);
  const [lottieStartTime, setLottieStartTime] = useState<number | null>(null);
  const [appIsReady, setAppIsReady] = useState(false);
  const [lottieFinished, setLottieFinished] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [maxTimeElapsed, setMaxTimeElapsed] = useState(false);

  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const hasTransitionedRef = useRef(false);

  useEffect(() => {
    SplashScreen.hide();
    setLoadingState(LoadingState.LOTTIE_LOADING);
    setLottieStartTime(Date.now());

    Animated.timing(lottieOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [lottieOpacity]);

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
    const canTransition = isNavigationReady && (minTimeElapsed || maxTimeElapsed) && lottieFinished;
    if (!canTransition || hasTransitionedRef.current) return;

    hasTransitionedRef.current = true;
    setAppIsReady(true);

    Animated.parallel([
      Animated.timing(lottieOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }),
    ]).start(() => {
      setLoadingState(LoadingState.APP_READY);
      onAppReady?.();
    });
  }, [
    loadingState,
    isNavigationReady,
    lottieFinished,
    minTimeElapsed,
    maxTimeElapsed,
    onAppReady,
    lottieOpacity,
    appOpacity,
  ]);

  const handleLottieFinish = useCallback(() => {
    setLottieFinished(true);
  }, []);

  return {
    loadingState,
    appIsReady,
    handleLottieFinish,
    appOpacity,
    lottieOpacity,
  };
}
