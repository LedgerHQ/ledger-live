import { useTranslation } from "react-i18next";
import React, { useCallback } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { SharedValue } from "react-native-reanimated";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useQueryClient } from "@tanstack/react-query";
import type { MainProps } from "LLM/features/Web3Hub/types";
import { queryKey } from "LLM/features/Web3Hub/components/ManifestsList/useManifestsListViewModel";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import TextInput from "~/components/TextInput";
import { NavigatorName, ScreenName } from "~/const";

const TITLE_HEIGHT = 50;
const SEARCH_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = TITLE_HEIGHT + SEARCH_HEIGHT;
export const ANIMATION_HEIGHT = TITLE_HEIGHT - 5;

type Props = {
  title?: string;
  navigation: MainProps["navigation"];
  layoutY: SharedValue<number>;
};

export default function Web3HubMainHeader({ title, navigation, layoutY }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
    <AnimatedBar
      pt={insets.top}
      layoutY={layoutY}
      style={styles.bar}
      backgroundColor={colors.background}
      animationHeight={ANIMATION_HEIGHT}
      opacityHeight={TITLE_HEIGHT}
      totalHeight={TOTAL_HEADER_HEIGHT}
      opacityChildren={
        <TouchableOpacity onPress={clearCache}>
          <Text mt={5} mb={2} numberOfLines={1} variant="h4" mx={5} accessibilityRole="header">
            {title}
          </Text>
        </TouchableOpacity>
      }
    >
      <Flex height={SEARCH_HEIGHT} ml={5} flexDirection="row" alignItems="center">
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
    </AnimatedBar>
  );
}

const styles = StyleSheet.create({
  bar: {
    zIndex: 1,
    position: "absolute",
    width: "100%",
  },
  inputContainer: {
    display: "flex",
    flex: 1,
    justifyContent: "center",
  },
});
