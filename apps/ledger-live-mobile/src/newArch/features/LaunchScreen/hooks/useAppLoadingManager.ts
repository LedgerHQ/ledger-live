import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const lottieOpacity = useRef(new Animated.Value(0)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;

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

    const checkTransition = () => {
      const elapsedTime = Date.now() - lottieStartTime;
      const minTimeReached = elapsedTime >= (config.lottieMinDuration || 0);
      const maxTimeReached = elapsedTime >= (config.lottieMaxDuration || Infinity);

      if (isNavigationReady && (minTimeReached || maxTimeReached) && lottieFinished) {
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
      } else {
        setTimeout(checkTransition, 50);
      }
    };

    const timeoutId = setTimeout(checkTransition, 0);
    return () => clearTimeout(timeoutId);
  }, [
    loadingState,
    isNavigationReady,
    lottieStartTime,
    config,
    lottieFinished,
    onAppReady,
    lottieOpacity,
    appOpacity,
  ]);

  const handleLottieFinish = useCallback(() => {
    setLottieFinished(true);
  }, []);

  return useMemo(
    () => ({
      loadingState,
      appIsReady,
      handleLottieFinish,
      appOpacity,
      lottieOpacity,
    }),
    [loadingState, appIsReady, handleLottieFinish, appOpacity, lottieOpacity],
  );
}
