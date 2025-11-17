import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import React from "react";
import styled from "styled-components";
import SwapWebView from "~/renderer/screens/exchange/Swap2/Form/SwapWebViewDemo3";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Card from "~/renderer/components/Box/Card";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

const EmbeddedContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

type SwapWebViewEmbeddedProps = {
  height?: string;
};

export default function SwapWebViewEmbedded({ height = "550px" }: SwapWebViewEmbeddedProps) {
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);

  const manifest = localManifest || remoteManifest;

  if (!manifest) {
    return (
      <Card
        grow
        style={{ overflow: "hidden", height, display: "flex", flexDirection: "column" }}
        data-testid="embedded-swap-container"
      >
        <Box flex={1} alignItems="center" justifyContent="center">
          <Text color="palette.text.shade60">Loading swap...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <Card
      grow
      style={{ overflow: "hidden", height, display: "flex", flexDirection: "column" }}
      data-testid="embedded-swap-container"
    >
      <EmbeddedContainer>
        <SwapWebView manifest={manifest} isEmbedded />
      </EmbeddedContainer>
    </Card>
  );
}
