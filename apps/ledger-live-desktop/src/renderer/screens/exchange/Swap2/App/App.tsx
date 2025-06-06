import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React from "react";
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

// set the default manifest ID for the production swap live app
// in case the FF is failing to load the manifest ID
// "swap-live-app-demo-3" points to production vercel URL for the swap live app
const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

export function SwapApp() {
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);
  const manifest = localManifest || remoteManifest;

  if (!manifest) {
    // TODO: fix with proper error handling
    return <ErrorWrapper>Unable to load application: missing manifest</ErrorWrapper>;
  }

  return (
    <Root>
      <SwapWebView manifest={manifest} />
    </Root>
  );
}
