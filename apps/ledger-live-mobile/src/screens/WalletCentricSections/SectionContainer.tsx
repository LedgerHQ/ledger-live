import React, { memo, type ReactNode } from "react";
import styled from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";
import { FlexBoxProps } from "@ledgerhq/native-ui/lib/components/Layout/Flex/index";
import Animated from "react-native-reanimated";

interface SectionContainerProps extends FlexBoxProps {
  isFirst?: boolean;
  isLast?: boolean;
  testID?: string;
}

const SectionContainer = styled(Flex).attrs<SectionContainerProps>(p => ({
  py: p.py || 8,
  borderTopWidth: p.isFirst ? 0 : 1,
  borderTopColor: "neutral.c30",
}))``;

const MemoizedSectionContainer = memo(SectionContainer);

interface AnimatedSectionContainerProps extends SectionContainerProps {
  children: ReactNode;
  py?: string;
  key?: string;
}

export default function AnimatedSectionContainer(props: AnimatedSectionContainerProps) {
  return (
    <Animated.View style={{ flex: 1 }} testID={props.testID}>
      <MemoizedSectionContainer {...props}>{props.children}</MemoizedSectionContainer>
    </Animated.View>
  );
}
