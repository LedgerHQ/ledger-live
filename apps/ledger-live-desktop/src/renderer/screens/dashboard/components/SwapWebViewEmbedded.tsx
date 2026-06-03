import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
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
import type { SwapNavigationState } from "LLD/features/Market/utils/swapNavigation";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || FEATURE_FLAGS_DEFAULTS.ptxSwapLiveApp.params?.manifest_id;

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
  isWallet40?: boolean;
}

function SwapCard({
  height,
  children,
  testId = "embedded-swap-container",
  isWallet40,
}: Readonly<SwapCardProps>) {
  const style = {
    overflow: "hidden" as const,
    height,
    display: "flex" as const,
    flexDirection: "column" as const,
    position: "relative" as const,
  };

  if (isWallet40) {
    return (
      <div
        style={style}
        data-testid={testId}
        className="overflow-hidden rounded-xl border border-muted-subtle"
      >
        {children}
      </div>
    );
  }

  return (
    <Card grow style={style} data-testid={testId}>
      {children}
    </Card>
  );
}

interface SwapWebViewEmbeddedProps {
  height?: string;
  isWallet40?: boolean;
  initialSwapState?: SwapNavigationState;
}

export default function SwapWebViewEmbedded({
  height = "550px",
  isWallet40,
  initialSwapState,
}: Readonly<SwapWebViewEmbeddedProps>) {
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);

  const { updateManifests, state } = useRemoteLiveAppContext();

  const manifest = localManifest || remoteManifest;

  if (!manifest && state.isLoading) {
    return (
      <SwapCard height={height} testId="embedded-swap-container-loader" isWallet40={isWallet40}>
        <SwapLoader isLoading />
      </SwapCard>
    );
  }

  if (!manifest) {
    return (
      <SwapCard height={height} testId="embedded-swap-container-warning" isWallet40={isWallet40}>
        <NetworkErrorScreen refresh={updateManifests} type="warning" />
      </SwapCard>
    );
  }

  return (
    <SwapCard height={height} isWallet40={isWallet40}>
      <EmbeddedContainer>
        <SwapWebView
          manifest={manifest}
          isEmbedded
          Loader={SwapLoader}
          initialState={initialSwapState}
        />
      </EmbeddedContainer>
    </SwapCard>
  );
}
