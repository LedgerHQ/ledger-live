import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import type { SearchProps } from "LLM/features/Web3Hub/types";
import AppIcon from "LLM/features/Web3Hub/components/AppIcon";
import { ScreenName } from "~/const";
import CurrencyIconList from "./CurrencyIconList";

export type NavigationProp = SearchProps["navigation"];

export default function SearchItem({
  manifest,
  navigation,
}: {
  manifest: AppManifest;
  navigation: NavigationProp;
}) {
  const { colors } = useTheme();
  const isDisabled = manifest.branch === "soon";

  const handlePress = useCallback(() => {
    if (isDisabled) {
      return;
    }
    navigation.push(ScreenName.Web3HubApp, {
      manifestId: manifest.id,
    });
  }, [isDisabled, navigation, manifest.id]);

  return (
    <TouchableOpacity disabled={isDisabled} onPress={handlePress}>
      <Flex
        flexDirection="row"
        alignItems="center"
        height={72}
        backgroundColor={colors.background}
        paddingX={4}
        paddingY={2}
      >
        <AppIcon isDisabled={isDisabled} size={48} name={manifest.name} icon={manifest.icon} />
        <Flex marginX={16} height="100%" flexGrow={1} flexShrink={1} justifyContent={"center"}>
          <Flex flexDirection="row" alignItems={"center"} mb={2}>
            <Text variant="large" numberOfLines={1} fontWeight="semiBold">
              {manifest.name}
            </Text>
          </Flex>
          <CurrencyIconList currencies={manifest.currencies} />
          {/* TODO add badges on certain categories */}
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
