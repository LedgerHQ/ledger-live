import React from "react";
import styled from "styled-components";

import Web3AppWebview from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";
import { TopBarRenderFunc, WebviewProps } from "../Web3AppWebview/types";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
`;

export const Wrapper = styled(Box).attrs(() => ({
  flex: 1,
}))`
  position: relative;
`;

const renderTopBar: TopBarRenderFunc = (manifest, webviewRef, webviewState) => (
  <TopBar manifest={manifest} webviewRef={webviewRef} webviewState={webviewState} />
);

export default function WebPTXPlayer({ manifest, inputs }: WebviewProps) {
  return (
    <Container>
      <Wrapper>
        <Web3AppWebview manifest={manifest} inputs={inputs} renderTopBar={renderTopBar} />
      </Wrapper>
    </Container>
  );
}
