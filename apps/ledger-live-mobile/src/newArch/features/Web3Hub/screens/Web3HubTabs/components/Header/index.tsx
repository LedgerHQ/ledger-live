import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Box, Text } from "@ledgerhq/native-ui";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import BackButton from "LLM/features/Web3Hub/components/BackButton";

const TITLE_HEIGHT = 50;

type Props = {
  title?: string;
  navigation: TabsProps["navigation"];
};

export default function Web3HubTabsHeader({ title, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Box
      backgroundColor={colors.background}
      paddingTop={insets.top}
      height={TITLE_HEIGHT + insets.top}
    >
      <BackButton onPress={navigation.goBack} />
      <Text mt={5} mb={2} numberOfLines={1} variant="h4" mx={5} accessibilityRole="header">
        {title}
      </Text>
    </Box>
  );
}
