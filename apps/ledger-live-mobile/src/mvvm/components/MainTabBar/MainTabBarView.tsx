import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import { Box, TabBar, TabBarItem } from "@ledgerhq/lumen-ui-rnative";
import type { MainTabBarViewProps } from "./types";

const GRADIENT_LOCATIONS: number[] = [0, 0.4, 1];

export const MainTabBarView: React.FC<MainTabBarViewProps> = ({
  activeRouteName,
  tabItems,
  onTabPress,
  hideTabBar,
  bottomInset,
  bottomOffset,
  gradientColors,
}) => {
  // Stabilize the children array passed to Lumen's <TabBar>. Its internal
  // pill-animation effect depends on `children` via a useCallback, and a fresh
  // array on every render cancels the in-flight withTiming before it can
  // progress — leaving the pill stuck (visible on Android 16 / RN 0.81).
  // Remove once @ledgerhq/lumen-ui-rnative ships the TabBar effect fix.
  const tabBarChildren = useMemo(
    () =>
      tabItems.map(item => (
        <TabBarItem
          key={item.value}
          value={item.value}
          label={item.label}
          icon={item.icon}
          activeIcon={item.activeIcon}
          testID={item.testID}
        />
      )),
    [tabItems],
  );

  if (hideTabBar) {
    return null;
  }

  return (
    <Animated.View
      testID="w40-tab-bar"
      entering={FadeInDown}
      exiting={FadeOutDown}
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      <Box lx={{ height: "s4" }} pointerEvents="none" />

      <LinearGradient
        colors={gradientColors}
        locations={GRADIENT_LOCATIONS}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <TabBar active={activeRouteName} onTabPress={onTabPress} lx={{ marginHorizontal: "s24" }}>
        {tabBarChildren}
      </TabBar>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
