import React, { useRef, useState } from "react";
import styled from "styled-components";

import { Web3AppWebview } from "../Web3AppWebview";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";

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

export default function WebRecoverPlayer({ manifest, inputs }: WebviewProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [, setWebviewState] = useState<WebviewState>(initialWebviewState);

  return (
    <Container>
      <Wrapper>
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          onStateChange={setWebviewState}
          ref={webviewAPIRef}
        />
      </Wrapper>
    </Container>
  );
}
