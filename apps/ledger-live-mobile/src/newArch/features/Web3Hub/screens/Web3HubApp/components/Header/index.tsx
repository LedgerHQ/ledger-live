import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { Box, Flex, Icons } from "@ledgerhq/native-ui";
import TextInput from "~/components/TextInput";
import Touchable from "~/components/Touchable";

const SEARCH_HEIGHT = 60;

type Props = {
  navigation: NativeStackHeaderProps["navigation"];
};

export default function Web3HubMainHeader({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Box
      backgroundColor={colors.background}
      paddingTop={insets.top}
      height={SEARCH_HEIGHT + insets.top}
    >
      <Flex height={SEARCH_HEIGHT} flexDirection="row" alignItems="center">
        <Touchable testID="navigation-header-back-button" onPress={navigation.goBack}>
          <Box p={5}>
            <Icons.ArrowLeft />
          </Box>
        </Touchable>
        <Box width={"80%"}>
          <TextInput
            placeholder="Current URL"
            keyboardType="default"
            returnKeyType="done"
            value=""
            disabled
          />
        </Box>
      </Flex>
    </Box>
  );
}
