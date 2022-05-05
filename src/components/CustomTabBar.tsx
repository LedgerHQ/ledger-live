import React from "react";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";

type SvgProps = {
  color: string;
};

function TabBarShape({ color }: SvgProps) {
  return (
    <Svg width={375} height="56" viewBox="0 0 375 56" fill="none">
      <Path d="M0 0H80V56H0V0Z" fill={color} />
      <Path
        d="M80 0H130.836C140.091 0 148.208 6.17679 150.676 15.097L151.848 19.3368C156.369 35.6819 171.243 47 188.202 47C205.439 47 220.484 35.3142 224.748 18.6125L225.645 15.097C227.913 6.21473 235.914 0 245.081 0H295V56H80V0Z"
        fill={color}
      />
      <Path d="M295 0H375V56H295V0Z" fill={color} />
    </Svg>
  );
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  colors,
}: any) {
  return (
    <Flex
      style={{ backgroundColor: "rgba(0,0,0,0)" }}
      width="100%"
      flexDirection="row"
      height={56}
      position="absolute"
      bottom={0}
    >
      <Flex
        position="absolute"
        bottom={0}
        left={0}
        width="30%"
        bg="neutral.c30"
        height="56"
      />
      <Flex
        position="absolute"
        bottom={0}
        right={0}
        width="30%"
        bg="neutral.c30"
        height="56"
      />
      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        bottom={0}
        left={-2}
        right={0}
      >
        <TabBarShape color={colors.neutral.c30} />
      </Flex>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const Icon = options.tabBarIcon;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // The `merge: true` option makes sure that the params inside the tab screen are preserved
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: "center",
            }}
          >
            <Icon color={isFocused ? colors.primary.c80 : colors.neutral.c80} />
          </TouchableOpacity>
        );
      })}
    </Flex>
  );
}
