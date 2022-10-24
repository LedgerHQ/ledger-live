import { Box } from "@ledgerhq/native-ui";
import React, { useContext } from "react";
import { Animated } from "react-native";
import Header from "../../screens/Portfolio/Header";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

function WalletTabHeader({ hidePortfolio }: { hidePortfolio: boolean }) {
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
  const y = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight],
    extrapolateRight: "clamp",
  });
  return (
    <Animated.View
      style={[
        {
          top: 0,
          height: headerHeight,
          width: "100%",
          position: "absolute",
        },
        { transform: [{ translateY: y }] },
      ]}
    >
      <Box flex={1} px={6} justifyContent={"flex-end"} bg={"background.main"}>
        <Header hidePortfolio={hidePortfolio} />
      </Box>
    </Animated.View>
  );
}

export default WalletTabHeader;
