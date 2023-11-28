import React, { useContext } from "react";
import { SafeAreaView, type SafeAreaViewProps } from "react-native-safe-area-context";
import { Animated } from "react-native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

function WalletTabSafeAreaView({ children, ...extraProps }: SafeAreaViewProps) {
  const { headerHeight } = useContext(WalletTabNavigatorScrollContext);
  return (
    <SafeAreaView style={{ flex: 1 }} {...extraProps}>
      <Animated.View
        style={{
          width: "100%",
          height: headerHeight + 8,
          opacity: 1,
        }}
      />
      {children}
    </SafeAreaView>
  );
}

export default WalletTabSafeAreaView;
