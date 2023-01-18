import React from "react";
import { ColorPalette, Flex } from "@ledgerhq/native-ui";
import { Dimensions, StyleSheet, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Svg, { Path, Stop } from "react-native-svg";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { TAB_BAR_HEIGHT, GRADIENT_HEIGHT } from "./shared";
import BackgroundGradient from "./BackgroundGradient";

type SvgProps = {
  color: string;
};

const getBgColor = (colors: ColorPalette) =>
  colors.type === "light" ? colors.neutral.c00 : colors.neutral.c20;

function TabBarShape({ color }: SvgProps) {
  return (
    <Svg
      width={375}
      height={TAB_BAR_HEIGHT}
      viewBox={`0 0 375 ${TAB_BAR_HEIGHT}`}
      fill="none"
    >
      <Path d="M0 0H80V56H0V0Z" fill={color} />
      <Path
        d="M80 0H130.836C140.091 0 148.208 6.17679 150.676 15.097L151.848 19.3368C156.369 35.6819 171.243 47 188.202 47C205.439 47 220.484 35.3142 224.748 18.6125L225.645 15.097C227.913 6.21473 235.914 0 245.081 0H295V56H80V0Z"
        fill={color}
      />
      <Path d="M295 0H375V56H295V0Z" fill={color} />
    </Svg>
  );
}

const BackgroundFiller = styled(Flex).attrs(p => ({
  position: "absolute",
  height: TAB_BAR_HEIGHT,
  width: "30%",
  backgroundColor: getBgColor(p.theme.colors),
}))``;

const BottomFiller = styled(Flex).attrs(p => ({
  position: "absolute",
  width: "100%",
  backgroundColor: getBgColor(p.theme.colors),
}))``;

const MiddleIconContainer = styled(Flex).attrs({
  ...StyleSheet.absoluteFillObject,
  top: undefined,
  flex: 1,
  alignItems: "center",
  zIndex: 1,
  justifyContent: "flex-end",
})``;

const Touchable = styled(TouchableOpacity)`
  flex: 1;
  align-items: center;
`;

const darkGradients = [
  {
    height: GRADIENT_HEIGHT,
    opacity: 0.8,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={0} stopColor="#131214" />,
      <Stop key="100%" offset="100%" stopOpacity={1} stopColor="#131214" />,
    ],
  },
  {
    height: 85,
    opacity: 0.8,
    stops: [
      <Stop key="0%" offset="0%" stopOpacity={0} stopColor="#131214" />,
      <Stop key="100%" offset="100%" stopOpacity={1} stopColor="#131214" />,
    ],
  },
];

const lightGradients = [
  {
    height: GRADIENT_HEIGHT,
    opacity: 1,
    stops: [
      <Stop key="0%" offset="0" stopOpacity={0} stopColor="#ffffff" />,
      <Stop key="100%" offset="100%" stopOpacity={0.8} stopColor="#ffffff" />,
    ],
  },
  {
    height: 85,
    opacity: 0.8,
    stops: [
      <Stop key="0%" offset="0" stopOpacity={0} stopColor="#ffffff" />,
      <Stop key="57%" offset="57%" stopOpacity={0.15} stopColor="#000000" />,
      <Stop key="100%" offset="100%" stopOpacity={0.15} stopColor="#000000" />,
    ],
  },
];

export type Props = {
  colors: ColorPalette;
  hideTabBar?: boolean;
} & BottomTabBarProps;

const TabBar = ({
  state,
  descriptors,
  navigation,
  colors,
  insets,
}: Props): JSX.Element => {
  const bgColor = getBgColor(colors);
  const gradients = colors.type === "light" ? lightGradients : darkGradients;
  const { bottom: bottomInset } = insets;

  return (
    <Flex
      width="100%"
      flexDirection="row"
      height={TAB_BAR_HEIGHT}
      bottom={bottomInset}
      position="absolute"
      overflow="visible"
    >
      <BackgroundGradient {...gradients[0]} />
      <BackgroundGradient {...gradients[1]} />
      <BottomFiller
        bottom={bottomInset ? -bottomInset : bottomInset}
        height={bottomInset}
      />
      <BackgroundFiller left={0} />
      <BackgroundFiller right={0} />
      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        left={-1}
        right={0}
      >
        <TabBarShape color={bgColor} />
      </Flex>
      {state.routes.map(
        (
          route: { key: keyof typeof descriptors; name: string },
          index: number,
        ) => {
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

          if (index === 2) {
            return (
              <React.Fragment key={index}>
                <Flex flex={1} />
                <MiddleIconContainer
                  pointerEvents="box-none"
                  style={{
                    height: Dimensions.get("screen").height,
                    bottom: bottomInset ? -bottomInset : bottomInset,
                  }}
                >
                  <Icon
                    color={isFocused ? colors.primary.c80 : colors.neutral.c80}
                  />
                </MiddleIconContainer>
              </React.Fragment>
            );
          }

          return (
            <Touchable
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
            >
              <Icon
                color={isFocused ? colors.primary.c80 : colors.neutral.c80}
              />
            </Touchable>
          );
        },
      )}
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
