import React from "react";
import { Platform, Pressable } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { SafeAreaView } from "react-native-safe-area-context";
import { OnboardingNavigatorParamList } from "./RootNavigator/types/OnboardingNavigator";
import { NavigatorName } from "~/const";
import { StackNavigatorProps } from "./RootNavigator/types/helpers";

export const MIN_MODAL_HEIGHT = 30;

const ScreenContainer = styled(Flex).attrs<{ p?: string }>(p => ({
  edges: ["bottom"],
  flex: 2,
  p: p.p ?? 6,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
}))``;

/* shitty hack to make the screen overflow under the empty space that is above the iOS menu bar at the bottom */
const bottomMenuBarOverflow = Platform.OS === "ios" ? 50 : 0;

const SafeContainer = styled(SafeAreaView)`
  flex: 1;
  margin-bottom: -${bottomMenuBarOverflow}px;
`;

const InnerContainer = styled(Flex).attrs({
  flex: 1,
  borderRadius: 50,
  paddingBottom: bottomMenuBarOverflow,
})``;

type Props = StackNavigatorProps<
  OnboardingNavigatorParamList,
  NavigatorName.OnboardingCarefulWarning | NavigatorName.OnboardingPreQuiz
> &
  React.PropsWithChildren<{
    children: React.ReactNode;
    contentContainerProps?: FlexBoxProps;
    deadZoneProps?: FlexBoxProps;
    backgroundColor?: string;
  }>;

export default function NavigationModalContainer({
  navigation,
  children,
  contentContainerProps,
  deadZoneProps,
  backgroundColor = "palette.neutral.c00",
}: Props) {
  return (
    <SafeContainer>
      <Flex minHeight={MIN_MODAL_HEIGHT} {...deadZoneProps}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            navigation.canGoBack() && navigation.goBack();
          }}
        />
      </Flex>

      <ScreenContainer backgroundColor={backgroundColor} {...contentContainerProps}>
        <InnerContainer>{children}</InnerContainer>
      </ScreenContainer>
    </SafeContainer>
  );
}
