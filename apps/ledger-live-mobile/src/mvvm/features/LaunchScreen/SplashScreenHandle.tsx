import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import SplashScreen from "react-native-splash-screen";

/**
 * Native splash screen handle that just fades screen directly
 * to application content for smooth transition between native
 * splash screen and screen content.
 */
export function SplashScreenHandle({
  children,
  isNavigationReady,
  onAppReady,
}: SplashScreenHandleProps) {
  const hasTransitionedRef = useRef(false);

  useEffect(() => {
    if (!isNavigationReady || hasTransitionedRef.current) return;
    hasTransitionedRef.current = true;
    SplashScreen.hide();
    onAppReady?.();
  }, [isNavigationReady, onAppReady]);

  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export interface SplashScreenHandleProps {
  children: React.ReactNode;
  isNavigationReady: boolean;
  onAppReady?: () => void;
}
