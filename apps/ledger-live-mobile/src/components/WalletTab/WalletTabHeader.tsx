import { Box } from "@ledgerhq/native-ui";
import React, { useContext } from "react";
import { Animated } from "react-native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import Header from "../../screens/Portfolio/Header";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";

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
        inputRange: [0, headerHeight - 24],
        outputRange: [1, 0],
        extrapolateRight: "clamp",
      });

  return (
    <>
      <Animated.View
        style={[
          {
            top: 0,
            height: headerHeight,
            width: "100%",
            position: "absolute",
            opacity,
          },
          { transform: [{ translateY: y }] },
        ]}
      >
        <Box
          flex={1}
          px={6}
          pb={walletNftGalleryFeature?.enabled ? 0 : 6}
          justifyContent={"flex-end"}
        >
          <Header hidePortfolio={hidePortfolio} />
        </Box>
      </Animated.View>
    </>
  );
}

export default WalletTabHeader;
