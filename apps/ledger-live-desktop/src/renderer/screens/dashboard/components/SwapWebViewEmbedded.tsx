import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React from "react";
import styled from "styled-components";
import SwapWebView from "~/renderer/screens/exchange/Swap2/Form/SwapWebViewDemo3";
import { SwapLoader } from "~/renderer/screens/exchange/Swap2/Form/SwapLoader";
import Card from "~/renderer/components/Box/Card";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

const EmbeddedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

interface SwapCardProps {
  height: string;
  children: React.ReactNode;
  testId?: string;
}

function SwapCard({
  height,
  children,
  testId = "embedded-swap-container",
}: Readonly<SwapCardProps>) {
  return (
    <Card
      grow
      style={{
        overflow: "hidden",
        height,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
      data-testid={testId}
    >
      {children}
    </Card>
  );
}

interface SwapWebViewEmbeddedProps {
  height?: string;
}

export default function SwapWebViewEmbedded({
  height = "550px",
}: Readonly<SwapWebViewEmbeddedProps>) {
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);

  const { updateManifests, state } = useRemoteLiveAppContext();

  const manifest = localManifest || remoteManifest;

  if (!manifest && state.isLoading) {
    return (
      <SwapCard height={height} testId="embedded-swap-container-loader">
        <SwapLoader isLoading />
      </SwapCard>
    );
  }

  if (!manifest) {
    return (
      <SwapCard height={height} testId="embedded-swap-container-warning">
        <NetworkErrorScreen refresh={updateManifests} type="warning" />
      </SwapCard>
    );
  }

  return (
    <SwapCard height={height}>
      <EmbeddedContainer>
        <SwapWebView manifest={manifest} isEmbedded Loader={SwapLoader} />
      </EmbeddedContainer>
    </SwapCard>
  );
}
