import React from "react";
import { space, SpaceProps } from "styled-system";
import styled from "styled-components/native";
import Animated from "react-native-reanimated";
import type { NativeSyntheticEvent, NativeScrollEvent, ScrollViewProps } from "react-native";

const ScrollView = styled(Animated.ScrollView)`
  ${space};
`;

type ScrollContainerProps = ScrollViewProps &
  SpaceProps & {
    children: React.ReactNode;
    onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
    horizontal?: boolean;
  };

const ScrollContainer = ({
  children,
  onScroll,
  horizontal = false,
  ...props
}: ScrollContainerProps): JSX.Element => (
  <ScrollView {...props} onScroll={onScroll} horizontal={horizontal}>
    {children}
  </ScrollView>
);

export default ScrollContainer;
