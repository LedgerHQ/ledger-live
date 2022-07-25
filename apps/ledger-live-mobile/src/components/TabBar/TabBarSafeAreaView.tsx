import React from "react";
import {
  NativeSafeAreaViewProps,
  SafeAreaView,
} from "react-native-safe-area-context";
import styled from "styled-components/native";

export { TAB_BAR_SAFE_HEIGHT } from "./shared";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
`;

const TabBarSafeAreaView = (props: NativeSafeAreaViewProps) => (
  <StyledSafeAreaView {...props} />
);

export default TabBarSafeAreaView;
