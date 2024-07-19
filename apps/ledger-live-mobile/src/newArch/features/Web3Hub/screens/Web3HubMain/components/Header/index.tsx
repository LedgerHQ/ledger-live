import { useTranslation } from "react-i18next";
import React, { useCallback, useContext } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useQueryClient } from "@tanstack/react-query";
import type { MainProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";
import { HeaderContext } from "LLM/features/Web3Hub/HeaderContext";
import { queryKey } from "LLM/features/Web3Hub/components/ManifestsList/useManifestsListViewModel";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { NavigatorName, ScreenName } from "~/const";

const TITLE_HEIGHT = 50;
const SEARCH_HEIGHT = 60;
const TOTAL_HEADER_HEIGHT = TITLE_HEIGHT + SEARCH_HEIGHT;

const ANIMATION_HEIGHT = TITLE_HEIGHT - 5;
const LAYOUT_RANGE = [0, 35];

type Props = {
  title?: string;
  navigation: MainProps["navigation"];
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
      height: TITLE_HEIGHT,
      opacity: interpolate(layoutY.value, [0, 35], [1, 0], Extrapolation.CLAMP),
    };
  });

  const goToSearch = useCallback(() => {
    navigation.push(NavigatorName.Web3Hub, {
      screen: ScreenName.Web3HubSearch,
    });
  }, [navigation]);

  // TODO remove later
  // Useful for testing the infinite loading and onEndReach working correctly
  const queryClient = useQueryClient();
  const clearCache = useCallback(() => {
    queryClient.resetQueries({ queryKey: queryKey("all") });
  }, [queryClient]);

  return (
    <Animated.View style={heightStyle}>
      <Animated.View style={transformStyle}>
        <Animated.View style={opacityStyle}>
          <TouchableOpacity onPress={clearCache}>
            <Text mt={5} mb={2} numberOfLines={1} variant="h4" mx={5} accessibilityRole="header">
              {title}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Flex flex={1} height={SEARCH_HEIGHT} ml={5} flexDirection="row" alignItems="center">
          <TouchableOpacity style={styles.inputContainer} onPress={goToSearch}>
            <View pointerEvents="none">
              <TextInput
                role="searchbox"
                placeholder={t("web3hub.main.header.placeholder")}
                keyboardType="default"
                returnKeyType="done"
                value=""
                disabled
              />
            </View>
          </TouchableOpacity>
          <TabButton count={2} navigation={navigation} />
        </Flex>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
  },
});
