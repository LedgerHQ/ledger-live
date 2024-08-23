import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React, { useState } from "react";
import styled from "styled-components";
import SwapWebView from "~/renderer/screens/exchange/Swap2/Form/SwapWebViewDemo3";

const Root = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

// TODO: fix with proper error handling
const ErrorWrapper = styled.div`
  width: auto;
  display: inline-flex;
  align-self: center;
  align-items: center;
  justify-self: center;
  justify-content: center;
  padding: 24px;
  border-radius: 14px;
  background-color: rgba(255, 0, 0, 0.3);
  color: #fff;
  font-weight: 500;
`;

export function SwapApp() {
  const [unavailable, setUnavailable] = useState(false);
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id;

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);
  const manifest = localManifest || remoteManifest;

  if (!manifest) {
    // TODO: fix with proper error handling
    return <ErrorWrapper>Unable to load application: missing manifest</ErrorWrapper>;
  }

  if (unavailable) {
    // TODO: fix with proper error handling
    return <ErrorWrapper>Unable to load application: Unavailable</ErrorWrapper>;
  }

  return (
    <Root>
      <SwapWebView manifest={manifest} liveAppUnavailable={() => setUnavailable(true)} />
    </Root>
  );
}
