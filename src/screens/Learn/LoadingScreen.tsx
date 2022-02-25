import React from "react";
import styled from "styled-components/native";
import { InfiniteLoader } from "@ledgerhq/native-ui";

const LoadingIndicatorContainer = styled.View`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  justify-content: center;
  align-items: center;
`;

const LoadingView = () => (
  <LoadingIndicatorContainer>
    <InfiniteLoader />
  </LoadingIndicatorContainer>
);

export default LoadingView;
