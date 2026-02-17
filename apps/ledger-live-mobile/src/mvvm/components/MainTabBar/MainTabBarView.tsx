import React from "react";
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
  if (hideTabBar) {
    return null;
  }

  return (
    <Animated.View
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

      <TabBar active={activeRouteName} onTabPress={onTabPress} lx={{ marginHorizontal: "s16" }}>
        {tabItems.map(item => (
          <TabBarItem
            key={item.value}
            value={item.value}
            label={item.label}
            icon={item.icon}
            activeIcon={item.activeIcon}
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
