import { Box, Flex } from "@ledgerhq/native-ui";
import React, { useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated } from "react-native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import PortfolioHeader from "~/screens/Portfolio/Header";
import { useExperimental } from "~/experimental";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

function WalletTabHeader({
  hidePortfolio,
  animated,
  useWallet40TopBar = false,
}: {
  hidePortfolio: boolean;
  animated?: boolean;
  useWallet40TopBar?: boolean;
}) {
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
  const insets = useSafeAreaInsets();
  const hasExperimentalHeader = useExperimental();

  if (useWallet40TopBar) {
    return null;
  }

  const y = animated
    ? 0
    : scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [0, -headerHeight],
        extrapolateRight: "clamp",
      });
  const opacity = animated
    ? 0
    : scrollY.interpolate({
        inputRange: [0, headerHeight],
        outputRange: [1, 0],
        extrapolateRight: "clamp",
      });

  return (
    <>
      <AnimatedFlex
        style={[
          {
            top: hasExperimentalHeader ? 0 : insets.top,
            height: headerHeight,
            width: "100%",
            position: "absolute",
            opacity,
          },
          { transform: [{ translateY: y }] },
        ]}
      >
        <Box flex={1} px={6} justifyContent={"flex-end"}>
          <PortfolioHeader hidePortfolio={hidePortfolio} />
        </Box>
      </AnimatedFlex>
    </>
  );
}

export default WalletTabHeader;
