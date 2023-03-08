import { WebviewTag } from "electron";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useCallback, useState } from "react";
import styled from "styled-components";

import Web3AppWebview from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";

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

interface Props {
  manifest: LiveAppManifest;
  inputs?: Record<string, string>;
}

export default function WebPTXPlayer({ manifest, inputs }: Props) {
  const [webview, setWebview] = useState<WebviewTag>(null);

  const webviewRef = useCallback(node => {
    setWebview(node);
  }, []);

  return (
    <Container>
      <Wrapper>
        {webview ? <TopBar manifest={manifest} webview={webview} /> : null}
        <Web3AppWebview manifest={manifest} inputs={inputs} ref={webviewRef} />
      </Wrapper>
    </Container>
  );
}
