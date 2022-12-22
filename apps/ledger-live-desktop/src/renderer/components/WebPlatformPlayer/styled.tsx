// Need react for the Box import, if not typescript is not happy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";
import styled from "styled-components";
import Box from "../Box";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;
// $FlowFixMe
export const CustomWebview = styled("webview")`
  border: none;
  width: 100%;
  flex: 1;
  transition: opacity 200ms ease-out;
`;

export const Wrapper = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;
export const Loader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;
