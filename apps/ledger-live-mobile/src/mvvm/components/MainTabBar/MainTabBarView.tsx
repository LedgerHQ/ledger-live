import React from "react";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { TabBar, TabBarItem } from "@ledgerhq/lumen-ui-rnative";
import type { MainTabBarViewProps } from "./types";

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
      entering={FadeInDown}
      exiting={FadeOutDown}
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        paddingBottom: bottomInset,
      }}
    >
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
