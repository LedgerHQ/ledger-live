import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { logStartupEvent } from "LLM/utils/logStartupTime";
import { LoadingState, LoadingConfig, DEFAULT_LOADING_CONFIG } from "./LoadingStates";
import LottieLauncher from "./components/LottieLauncher";
import { useAppLoadingManager } from "./hooks/useAppLoadingManager";
import Config from "react-native-config";

export interface AppLoadingManagerProps {
  children: React.ReactNode;
  isNavigationReady: boolean;
  config?: LoadingConfig;
  onAppReady?: () => void;
}

export const AppLoadingManager: React.FC<AppLoadingManagerProps> = ({
  children,
  isNavigationReady,
  config = DEFAULT_LOADING_CONFIG,
  onAppReady,
}) => {
  logStartupEvent("Splash screen render");

  const { loadingState, appIsReady, appOpacity, lottieOpacity, lottieStarted } =
    useAppLoadingManager({ isNavigationReady, config, onAppReady });

  if (Config.DETOX) {
    return children;
  }

  // Only show Lottie if it was actually started (not skipped when nav was ready early)
  const showLottie = lottieStarted && (loadingState === LoadingState.LOTTIE_LOADING || appIsReady);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.absoluteFill,
          {
            opacity: appOpacity,
            pointerEvents: loadingState === LoadingState.APP_READY ? "auto" : "none",
          },
        ]}
      >
        {children}
      </Animated.View>

      {showLottie && (
        <Animated.View
          style={[
            styles.absoluteFill,
            { opacity: lottieOpacity, zIndex: loadingState === LoadingState.APP_READY ? -1 : 1 },
          ]}
        >
          <LottieLauncher />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131214",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
