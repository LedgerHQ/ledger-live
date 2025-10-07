import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";

import { Web3AppWebview } from "../Web3AppWebview";
import Box from "../Box";
import { WebviewAPI, WebviewProps, WebviewState } from "../Web3AppWebview/types";
import { initialWebviewState } from "../Web3AppWebview/helpers";
import { TopBar } from "./TopBar";
import { useDeeplinkCustomHandlers } from "../WebPlatformPlayer/CustomHandlers";

type RecoverWebviewProps = WebviewProps & {
  onClose: () => void;
};

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  margin-top: 20px;
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
  const recoverServices = useFeature("protectServicesDesktop");
  const openWithDevTools = recoverServices?.params?.openWithDevTools;
  const [hasOpenedDevTools, setHasOpenedDevTools] = useState<boolean>(false);
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();

  useEffect(() => {
    if (!openWithDevTools || !webviewAPIRef || hasOpenedDevTools || !webviewState.url) return;

    const webview = safeGetRefValue(webviewAPIRef);
    webview.openDevTools();
    setHasOpenedDevTools(true);
  }, [openWithDevTools, webviewAPIRef, webviewState, hasOpenedDevTools, setHasOpenedDevTools]);

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
          customHandlers={customDeeplinkHandlers}
        />
      </Wrapper>
    </Container>
  );
}
