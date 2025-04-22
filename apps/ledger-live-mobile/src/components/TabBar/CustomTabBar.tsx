import React, { useEffect } from "react";
import { ColorPalette, Flex } from "@ledgerhq/native-ui";
import { Dimensions, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TAB_BAR_HEIGHT } from "./shared";
import { TAB_INDICATOR_WIDTH, TabIndicator } from "./TabIndicator";

const getBgColor = (colors: ColorPalette) =>
  colors.type === "light" ? colors.neutral.c00 : colors.neutral.c20;

const Touchable = styled(TouchableOpacity)`
  flex: 1;
  align-items: center;
`;
export type Props = {
  colors: ColorPalette;
  hideTabBar?: boolean;
} & BottomTabBarProps;

const TabBar = ({ state, descriptors, navigation, colors, insets }: Props): JSX.Element => {
  const bgColor = getBgColor(colors);
  const { bottom: bottomInset } = insets;
  const translateX = useSharedValue(0);

  useEffect(() => {
    const tabCenterX =
      state.index * (Dimensions.get("window").width / state.routes.length) +
      Dimensions.get("window").width / state.routes.length / 2;
    const indicatorTranslateX = tabCenterX - TAB_INDICATOR_WIDTH / 2;
    translateX.value = withTiming(indicatorTranslateX);
  }, [state.index, state.routes.length, translateX]);

  return (
    <Flex
      width="100%"
      flexDirection="row"
      height={TAB_BAR_HEIGHT + bottomInset * 1.2}
      bottom={0}
      alignItems="center"
      position="absolute"
      overflow="visible"
      backgroundColor={bgColor}
      marginX={2}
    >
      <TabIndicator translateX={translateX} />
      {state.routes.map((route: { key: keyof typeof descriptors; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const Icon = options.tabBarIcon as React.ElementType<{
          color: string;
        }>;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate({
              name: route.name,
              merge: true,
              params: undefined,
            });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <Touchable
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              marginBottom: 32,
            }}
          >
            <Icon color={isFocused ? colors.primary.c80 : colors.neutral.c80} />
          </Touchable>
        );
      })}
    </Flex>
  );
};

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  colors,
  insets,
  hideTabBar = false,
}: Props): JSX.Element {
  return (
    <Animated.View>
      {!hideTabBar && (
        <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
          <TabBar
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
