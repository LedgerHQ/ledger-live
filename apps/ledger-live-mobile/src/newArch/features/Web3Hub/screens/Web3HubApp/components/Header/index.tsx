import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { Box, Flex } from "@ledgerhq/native-ui";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { AppProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";

const SEARCH_HEIGHT = 60;

type Props = {
  navigation: AppProps["navigation"];
};

export default function Web3HubAppHeader({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Box
      backgroundColor={colors.background}
      paddingTop={insets.top}
      height={SEARCH_HEIGHT + insets.top}
    >
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
    </Box>
  );
}
