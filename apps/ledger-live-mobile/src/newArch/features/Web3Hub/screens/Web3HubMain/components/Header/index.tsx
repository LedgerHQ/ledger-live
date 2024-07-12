import { useTranslation } from "react-i18next";
import React, { useCallback, useContext } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { Flex, Text } from "@ledgerhq/native-ui";
import TextInput from "~/components/TextInput";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import { ScreenName } from "~/const";

const TITLE_HEIGHT = 50;
const SEARCH_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = TITLE_HEIGHT + SEARCH_HEIGHT;

const ANIMATION_HEIGHT = TITLE_HEIGHT - 5;
const LAYOUT_RANGE = [0, 35];

type Props = {
  title?: string;
  navigation: NativeStackHeaderProps["navigation"];
};

export default function Web3HubMainHeader({ title, navigation }: Props) {
  const { t } = useTranslation();
  const { layoutY } = useContext(HeaderContext);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const heightStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
      backgroundColor: colors.background,
      paddingTop: insets.top,
      height:
        interpolate(
          layoutY.value,
          LAYOUT_RANGE,
          [TOTAL_HEADER_HEIGHT, TOTAL_HEADER_HEIGHT - ANIMATION_HEIGHT],
          Extrapolation.CLAMP,
        ) + insets.top,
    };
  });

  const transformStyle = useAnimatedStyle(() => {
    if (!layoutY) return {};

    return {
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
      opacity: interpolate(layoutY.value, [0, 35], [1, 0], Extrapolation.CLAMP),
    };
  });

  const goToSearch = useCallback(() => {
    navigation.push(ScreenName.Web3HubSearch, {});
  }, [navigation]);

  return (
    <Animated.View style={heightStyle}>
      <Animated.View style={transformStyle}>
        <Animated.View style={opacityStyle}>
          <Text mt={5} mb={2} numberOfLines={1} variant="h4" mx={5} accessibilityRole="header">
            {title}
          </Text>
        </Animated.View>
        <Flex height={SEARCH_HEIGHT} mx={5} justifyContent="center">
          <TouchableOpacity onPress={goToSearch}>
            <View pointerEvents="none">
              <TextInput
                testID="web3hub-main-header-search"
                placeholder={t("web3hub.main.header.placeholder")}
                keyboardType="default"
                returnKeyType="done"
                value=""
                disabled
              />
            </View>
          </TouchableOpacity>
        </Flex>
      </Animated.View>
    </Animated.View>
  );
}
