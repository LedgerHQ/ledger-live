import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import Card from "~/renderer/components/Box/Card";
import { useSwapWebViewManager } from "~/renderer/components/SwapWebViewManager";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";

const PortalTarget = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

/**
 * Wrapper component for embedded swap webview.
 * The actual webview is rendered via portal from SwapWebViewManager.
 *
 * This component handles the manifest loading state independently,
 * allowing navigation to potentially fix loading issues.
 */
export default function SwapWebViewEmbedded() {
  const portalTargetRef = useRef<HTMLDivElement>(null);
  const { updateManifests } = useRemoteLiveAppContext();
  const { registerTarget, unregisterTarget, isManifestLoaded } = useSwapWebViewManager();

  useEffect(() => {
    if (portalTargetRef.current) {
      registerTarget("embedded", portalTargetRef.current);
    }
    return () => {
      unregisterTarget("embedded");
    };
  }, [registerTarget, unregisterTarget]);

  // Show error screen if manifest fails to load
  // This is NOT in the portal, so navigating away and back will retry
  if (!isManifestLoaded) {
    return (
      <Card
        grow
        style={{ overflow: "hidden", height: "550px", display: "flex", flexDirection: "column" }}
        data-testid="embedded-swap-container"
      >
        <NetworkErrorScreen refresh={updateManifests} type="warning" />
      </Card>
    );
  }

  return (
    <Card
      grow
      style={{ overflow: "hidden", height: "550px", display: "flex", flexDirection: "column" }}
      data-testid="embedded-swap-container"
    >
      <PortalTarget ref={portalTargetRef} />
    </Card>
  );
}
