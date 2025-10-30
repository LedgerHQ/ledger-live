import React, { useContext } from "react";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import { Animated } from "react-native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

function WalletTabSafeAreaView({
  children,
  ...extraProps
}: React.ComponentProps<typeof SafeAreaViewFixed>) {
  const { headerHeight } = useContext(WalletTabNavigatorScrollContext);
  return (
    <SafeAreaViewFixed style={{ flex: 1 }} {...extraProps}>
      <Animated.View
        style={{
          width: "100%",
          height: headerHeight + 8,
          opacity: 1,
        }}
      />
      {children}
    </SafeAreaViewFixed>
  );
}

export default WalletTabSafeAreaView;
