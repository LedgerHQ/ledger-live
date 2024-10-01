import React from "react";
import { useTheme } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import type { TabsProps } from "LLM/features/Web3Hub/types";
import BackButton from "LLM/features/Web3Hub/components/BackButton";

const TITLE_HEIGHT = 50;

type Props = {
  title?: string;
  navigation: TabsProps["navigation"];
};

export default function Web3HubTabsHeader({ title, navigation }: Props) {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="row"
      backgroundColor={colors.background}
      height={TITLE_HEIGHT}
      alignItems={"center"}
    >
      <BackButton onPress={navigation.goBack} />
      <Text
        flex={1}
        numberOfLines={1}
        variant="h5"
        mr={50}
        accessibilityRole="header"
        textAlign={"center"}
      >
        {title}
      </Text>
    </Flex>
  );
}
