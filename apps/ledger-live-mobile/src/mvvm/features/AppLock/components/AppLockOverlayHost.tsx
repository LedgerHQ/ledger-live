import { BottomSheetModalProvider } from "@ledgerhq/lumen-ui-rnative";
import { OverAppLock } from "LLM/components/QueuedDrawer/useIsScreenVisible";
import React from "react";
import { StyleSheet, View } from "react-native";

export function AppLockOverlayHost({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <BottomSheetModalProvider>
        <OverAppLock>{children}</OverAppLock>
      </BottomSheetModalProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});
