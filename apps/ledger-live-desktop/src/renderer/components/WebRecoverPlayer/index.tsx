import React, { useRef, useState } from "react";
import styled from "styled-components";

import { Web3AppWebview } from "../Web3AppWebview";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { TopBar } from "./TopBar";

type RecoverWebviewProps = WebviewProps & {
  onClose: () => void;
};

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

const recoverIdsShowTopBar = [
  "protect-local",
  "protect-local-dev",
  "protect-simu",
  "protect-staging",
  "protect-staging-v2",
];

export default function WebRecoverPlayer({ manifest, inputs, onClose }: RecoverWebviewProps) {
  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  return (
    <Container>
      <Wrapper>
        {recoverIdsShowTopBar.includes(manifest.id) ? (
          <TopBar
            manifest={manifest}
            webviewAPIRef={webviewAPIRef}
            webviewState={webviewState}
            onClose={onClose}
          />
        ) : null}
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
