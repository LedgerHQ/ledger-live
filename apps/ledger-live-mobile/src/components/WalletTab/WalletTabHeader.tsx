import { Box, Flex } from "@ledgerhq/native-ui";
import React, { useContext } from "react";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Animated } from "react-native";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import Header from "~/screens/Portfolio/Header";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

function WalletTabHeader({
  hidePortfolio,
  animated,
}: {
  hidePortfolio: boolean;
  animated?: boolean;
}) {
  const walletNftGalleryFeature = useFeature("walletNftGallery");
  const { scrollY, headerHeight } = useContext(WalletTabNavigatorScrollContext);
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

  const insets = useSafeAreaInsets();

  return (
    <>
      <AnimatedFlex
        style={[
          {
            top: insets.top,
            height: headerHeight,
            width: "100%",
            position: "absolute",
            opacity,
          },
          { transform: [{ translateY: y }] },
        ]}
        mode={"margin"}
      >
        <Box
          flex={1}
          px={6}
          pb={walletNftGalleryFeature?.enabled ? 0 : 6}
          justifyContent={"flex-end"}
        >
          <Header hidePortfolio={hidePortfolio} />
        </Box>
      </AnimatedFlex>
    </>
  );
}

export default WalletTabHeader;
