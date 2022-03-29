import React from "react";
import { Pressable } from "react-native";
import { Flex, ScrollContainer } from "@ledgerhq/native-ui";
import { StackScreenProps } from "@react-navigation/stack";
import styled from "styled-components/native";
import type { FlexBoxProps } from "@ledgerhq/native-ui/components/layout/Flex";
import { SafeAreaView } from "react-native-safe-area-context";

export const MIN_MODAL_HEIGHT = 30;

const ScreenContainer = styled(Flex).attrs(p => ({
  edges: ["bottom"],
  flex: 1,
  p: p.p ?? 6,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
}))``;
type Props = StackScreenProps<{}> & { 
  children: React.ReactNode, 
  contentContainerProps?: FlexBoxProps,
  deadZoneProps?: FlexBoxProps,
  backgroundColor?: string,
 };

export default function NavigationModalContainer({
  navigation,
  children,
  contentContainerProps,
  deadZoneProps,
  backgroundColor = "palette.neutral.c00",
}: Props) {
  return (
    <SafeAreaView style={{flex: 1 }}>
      <Flex minHeight={MIN_MODAL_HEIGHT} {...deadZoneProps}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => {
            navigation.canGoBack() && navigation.goBack();
          }}
        />
      </Flex>

      <ScreenContainer backgroundColor={backgroundColor} {...contentContainerProps}>
        <Flex style={{ flex: 1, borderRadius: 50 }}>
          {children}
        </Flex>
      </ScreenContainer>
    </SafeAreaView>
  );
}
