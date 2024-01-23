import React, { useRef, useState } from "react";
import styled from "styled-components";
import { Web3AppWebview } from "../Web3AppWebview";
import { TopBar } from "./TopBar";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { usePTXCustomHandlers } from "./CustomHandlers";

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

export default function WebPTXPlayer({ manifest, inputs }: WebviewProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  const customHandlers = usePTXCustomHandlers(manifest);

  return (
    <Container>
      <Wrapper>
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={setWebviewState}
          ref={webviewAPIRef}
          customHandlers={customHandlers}
        />
      </Wrapper>
    </Container>
  );
}
