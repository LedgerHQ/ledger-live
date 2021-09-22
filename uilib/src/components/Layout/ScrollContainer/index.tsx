import React from "react";
import { margin, padding } from "styled-system";
import styled from "styled-components/native";
import Animated from "react-native-reanimated";
import type { NativeSyntheticEvent, NativeScrollEvent, ScrollViewProps, } from 'react-native';

const ScrollView = styled(Animated.ScrollView)`
  ${margin};
  ${padding};
`;

type ScrollContainerProps = ScrollViewProps & {
  children: React.ReactNode;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  horizontal?: boolean;
};

const ScrollContainer = ({ children, onScroll, horizontal = false }: ScrollContainerProps): JSX.Element => (
  <ScrollView onScroll={onScroll} horizontal={horizontal}>
    {children}
  </ScrollView>
);

export default ScrollContainer;
