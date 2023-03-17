import React, { useCallback } from "react";
import styled from "styled-components";

import Web3AppWebview from "../Web3AppWebview";
import { TopBar, TopBarConfig } from "./TopBar";
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

export type WebPlatformPlayerConfig = {
  topBarConfig?: TopBarConfig;
};

type Props = {
  onClose?: () => void;
  config?: WebPlatformPlayerConfig;
} & WebviewProps;

export default function WebPlatformPlayer({ manifest, inputs, onClose, config }: Props) {
  const renderTopBar = useCallback<TopBarRenderFunc>(
    (manifest, webviewRef, webviewState) => (
      <TopBar
        manifest={manifest}
        onClose={onClose}
        webviewRef={webviewRef}
        webviewState={webviewState}
        config={config?.topBarConfig}
      />
    ),
    [onClose, config],
  );

  return (
    <Container>
      <Wrapper>
        <Web3AppWebview manifest={manifest} inputs={inputs} renderTopBar={renderTopBar} />
      </Wrapper>
    </Container>
  );
}
