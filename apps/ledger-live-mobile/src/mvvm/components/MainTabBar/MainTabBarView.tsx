import React from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Box, LinearGradient, TabBar, TabBarItem } from "@ledgerhq/lumen-ui-rnative";
import type { LumenStyleSheetTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { MainTabBarViewProps } from "./types";

const GRADIENT_STOPS = [
  { color: "base", offset: 0, opacity: 0 },
  { color: "base", offset: 0.4, opacity: 0.7 },
  { color: "base", offset: 1, opacity: 0.8 },
] satisfies {
  color: keyof LumenStyleSheetTheme["colors"]["bg"];
  offset: number;
  opacity: number;
}[];

export const MainTabBarView: React.FC<MainTabBarViewProps> = ({
  activeRouteName,
  tabItems,
  onTabPress,
  hideTabBar,
  bottomInset,
  bottomOffset,
}) => {
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

      <LinearGradient stops={GRADIENT_STOPS} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <TabBar active={activeRouteName} onTabPress={onTabPress} lx={{ marginHorizontal: "s24" }}>
        {tabItems.map(item => (
          <TabBarItem
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.icon}
            activeIcon={item.activeIcon}
            testID={item.testID}
          />
        ))}
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
