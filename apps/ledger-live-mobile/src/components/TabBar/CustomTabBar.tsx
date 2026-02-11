import React from "react";
import { ColorPalette } from "@ledgerhq/native-ui";
import { Platform, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { TabBar, TabBarItem } from "@ledgerhq/lumen-ui-rnative";
import { useKeyboardVisible } from "~/logic/keyboardVisible";
import { Stop } from "react-native-svg";
import { GRADIENT_HEIGHT } from "./shared";
import BackgroundGradient from "./BackgroundGradient";
import { Home, HomeFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

export type Props = {
  colors: ColorPalette;
  hideTabBar?: boolean;
} & BottomTabBarProps;

function LumenTabBar({
  state,
  descriptors,
  navigation,
  colors,
  insets,
}: Omit<Props, "hideTabBar">): React.JSX.Element {
  const { bottom: bottomInset } = insets;
  const { keyboardHeight } = useKeyboardVisible();
  const { colorScheme } = useTheme();

  let adjustedBottom = 0;
  if (Platform.OS === "android" && Platform.Version >= 35) {
    adjustedBottom = bottomInset + keyboardHeight;
  } else {
    adjustedBottom = bottomInset;
  }

  const activeRoute = state.routes[state.index];
  const active = activeRoute?.name ?? state.routes[0]?.name;

  const handleTabPress = (name: string) => {
    const event = navigation.emit({
      type: "tabPress",
      target: state.routes.find(r => r.name === name)?.key ?? state.routes[0].key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate({ name, merge: true, params: undefined });
    }
  };

  const stopColor = colorScheme === "dark" ? "#000000" : "#FFFFFF";
  const gradientStops = [
    <Stop key="0" offset="0.01%" stopColor={stopColor} stopOpacity={0} />,
    <Stop key="40" offset="60%" stopColor={stopColor} stopOpacity={0.4} />,
    <Stop key="100" offset="99.99%" stopColor={stopColor} stopOpacity={0.8} />,
  ];

  return (
    <>
      <View
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 0 }}
        pointerEvents="none"
      >
        <BackgroundGradient height={GRADIENT_HEIGHT} opacity={1} stops={gradientStops} />
      </View>
      <View
        style={{
          position: "absolute",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          bottom: adjustedBottom,
          zIndex: 1,
        }}
        pointerEvents="box-none"
      >
        <TabBar active={active} onTabPress={handleTabPress} lx={{ width: "s400" }}>
          {state.routes.map(route => {
            const { options } = descriptors[route.key];
            const tabBarIcon = options.tabBarIcon;
            const inactiveColor = colors.neutral.c80;
            const activeColor = colors.primary.c80;
            return (
              <TabBarItem
                key={route.key}
                value={route.name}
                icon={Home}
                label={"Home"}
                activeIcon={HomeFill}
              />
            );
          })}
        </TabBar>
      </View>
    </>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  colors,
  insets,
  hideTabBar = false,
}: Props): React.JSX.Element {
  return (
    <Animated.View pointerEvents="box-none">
      {!hideTabBar && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown} pointerEvents="box-none">
          <LumenTabBar
            state={state}
            descriptors={descriptors}
            navigation={navigation}
            colors={colors}
            insets={insets}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}
