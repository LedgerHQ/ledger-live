import React from "react";
import { useTheme } from "@react-navigation/native";
import { SharedValue } from "react-native-reanimated";
import { Flex } from "@ledgerhq/native-ui";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { AppProps } from "LLM/features/Web3Hub/types";
import TextInput from "~/components/TextInput";

const SEARCH_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = SEARCH_HEIGHT;
const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;

type Props = {
  navigation: AppProps["navigation"];
  layoutY: SharedValue<number>;
};

export default function Web3HubAppHeader({ navigation, layoutY }: Props) {
  const { colors } = useTheme();

  return (
    <AnimatedBar
      layoutY={layoutY}
      backgroundColor={colors.background}
      animationHeight={ANIMATION_HEIGHT}
      opacityHeight={TOTAL_HEADER_HEIGHT}
      totalHeight={TOTAL_HEADER_HEIGHT}
      opacityChildren={
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
      }
    />
  );
}
