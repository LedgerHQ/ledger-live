import { Box } from "@ledgerhq/native-ui";
import React, { useContext } from "react";
import { Animated, NativeModules } from "react-native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useHeaderHeight } from "@react-navigation/elements";
import { WalletTabNavigatorScrollContext } from "./WalletTabNavigatorScrollManager";
import Header from "../../screens/Portfolio/Header";
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { getStatusBarHeight as getStatusBarHeightAlternative } from "react-native-safearea-height";

const { StatusBarManager } = NativeModules;

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

  const { top } = useSafeAreaInsets();
  const headerHeight2 = useHeaderHeight();

  console.log("headerHeight", headerHeight2);
  console.log(
    "Constants.statusBarHeight",
    Constants.statusBarHeight,
    Constants,
  );
  console.log("StatusBarManager.HEIGHT", StatusBarManager.HEIGHT);
  console.log("getStatusBarHeight()", getStatusBarHeight());
  console.log("getStatusBarHeightAlternative()", getStatusBarHeightAlternative());

  return (
    <>
      <Animated.View
        style={[
          {
            top,
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
