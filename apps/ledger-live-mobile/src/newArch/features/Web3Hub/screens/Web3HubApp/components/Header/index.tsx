import React, { useContext } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { Flex } from "@ledgerhq/native-ui";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { AppProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";

const SEARCH_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = SEARCH_HEIGHT;

const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;
const LAYOUT_RANGE = [0, ANIMATION_HEIGHT];

type Props = {
  navigation: AppProps["navigation"];
};

export default function Web3HubAppHeader({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { layoutY } = useContext(HeaderContext);

  const heightStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    const headerHeight = interpolate(
      layoutY.value,
      LAYOUT_RANGE,
      [TOTAL_HEADER_HEIGHT, TOTAL_HEADER_HEIGHT - ANIMATION_HEIGHT],
      Extrapolation.CLAMP,
    );

    return {
      backgroundColor: colors.background,
      paddingTop: insets.top,
      height: headerHeight + insets.top,
    };
  });

  const transformStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      // Height necessary for proper transform
      height: TOTAL_HEADER_HEIGHT,
      transform: [
        {
          translateY: interpolate(
            layoutY.value,
            LAYOUT_RANGE,
            [0, -ANIMATION_HEIGHT],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      height: TOTAL_HEADER_HEIGHT,
      opacity: interpolate(layoutY.value, [0, ANIMATION_HEIGHT], [1, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={heightStyle}>
      <Animated.View style={transformStyle}>
        <Animated.View style={opacityStyle}>
          <Flex flex={1} height={SEARCH_HEIGHT} flexDirection="row" alignItems="center">
            <BackButton onPress={navigation.goBack} />
            <Flex flex={1}>
              <TextInput
                placeholder="Current URL"
                keyboardType="default"
                returnKeyType="done"
                value=""
                disabled
              />
            </Flex>
            <TabButton count={2} navigation={navigation} />
          </Flex>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
