import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Box, Icons, Text } from "@ledgerhq/native-ui";
import Touchable from "~/components/Touchable";

const TITLE_HEIGHT = 50;

type Props = {
  title?: string;
  navigation: NativeStackHeaderProps["navigation"];
};

export default function Web3HubMainHeader({ title, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Box
      backgroundColor={colors.background}
      paddingTop={insets.top}
      height={TITLE_HEIGHT + insets.top}
    >
      <Touchable testID="navigation-header-back-button" onPress={navigation.goBack}>
        <Box p={5}>
          <Icons.ArrowLeft />
        </Box>
      </Touchable>
      <Text mt={5} mb={2} numberOfLines={1} variant="h4" mx={5} accessibilityRole="header">
        {title}
      </Text>
    </Box>
  );
}
