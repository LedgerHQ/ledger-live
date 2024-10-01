import React from "react";
import { useTheme } from "@react-navigation/native";
import { SharedValue } from "react-native-reanimated";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import AnimatedBar from "LLM/features/Web3Hub/components/AnimatedBar";
import BackButton from "LLM/features/Web3Hub/components/BackButton";
import TabButton from "LLM/features/Web3Hub/components/TabButton";
import { AppProps } from "LLM/features/Web3Hub/types";

const BAR_HEIGHT = 60;
export const TOTAL_HEADER_HEIGHT = BAR_HEIGHT;
const ANIMATION_HEIGHT = TOTAL_HEADER_HEIGHT;

type Props = {
  navigation: AppProps["navigation"];
  layoutY: SharedValue<number>;
  initialLoad: boolean;
  secure: boolean;
  baseUrl: string;
  manifest: any;
};

export default function Web3HubAppHeader({
  navigation,
  layoutY,
  initialLoad,
  secure,
  baseUrl,
  manifest,
}: Props) {
  const { colors } = useTheme();

  return (
    <AnimatedBar
      layoutY={layoutY}
      backgroundColor={colors.background}
      animationHeight={ANIMATION_HEIGHT}
      opacityHeight={TOTAL_HEADER_HEIGHT}
      totalHeight={TOTAL_HEADER_HEIGHT}
      opacityChildren={
        <Flex flex={1} height={BAR_HEIGHT} flexDirection="row" alignItems="center">
          <BackButton onPress={navigation.goBack} />
          <Flex
            flex={1}
            height={40}
            backgroundColor={colors.lightGrey}
            borderRadius={14}
            flexDirection={"row"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            {initialLoad ? null : (
              <>
                {secure ? (
                  <Icons.Lock color={colors.grey} size="S" />
                ) : (
                  <Icons.Warning color={colors.alert} size="S" />
                )}
                <Text ml={2} color={colors.grey}>
                  {baseUrl}
                </Text>
              </>
            )}
          </Flex>

          <TabButton count={2} navigation={navigation} manifest={manifest} />
        </Flex>
      }
    />
  );
}
