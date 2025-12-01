import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useSwapWebViewManager } from "~/renderer/components/SwapWebViewManager";

const Root = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  flex: 1;
  position: relative;
`;

const PortalTarget = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
`;

/**
 * Wrapper component for fullpage swap webview.
 * The actual webview is rendered via portal from SwapWebViewManager.
 *
 * This component handles the manifest loading state independently,
 * allowing navigation to potentially fix loading issues.
 *
 * Deep link support: Tracks URL changes (pathname + search + hash) AND
 * location.state (used for account/token params from internal navigation)
 * and forces webview remount when params change for proper deep linking.
 */
export function SwapApp() {
  const location = useLocation<{
    defaultAccount?: unknown;
    defaultParentAccount?: unknown;
    defaultAmountFrom?: string;
    from?: string;
    defaultToken?: unknown;
    affiliate?: string;
  }>();
  const { updateManifests } = useRemoteLiveAppContext();
  const { registerTarget, unregisterTarget, isManifestLoaded } = useSwapWebViewManager();
  const portalTargetRef = useRef<HTMLDivElement>(null);

  // Create a unique key from URL + location.state for deep link support
  // location.state contains account/token params passed from internal navigation
  const urlKey = `${location.pathname}${location.search}${location.hash}${JSON.stringify(location.state || {})}`;

  useEffect(() => {
    if (portalTargetRef.current) {
      // Pass the URL key so the manager can detect when params change
      registerTarget("fullpage", portalTargetRef.current, urlKey);
    }
    return () => {
      unregisterTarget("fullpage");
    };
  }, [registerTarget, unregisterTarget, urlKey]);

  // Show error screen if manifest fails to load
  // This is NOT in the portal, so navigating away and back will retry
  if (!isManifestLoaded) {
    return <NetworkErrorScreen refresh={updateManifests} type="warning" />;
  }

  return (
    <Root>
      <PortalTarget ref={portalTargetRef} />
    </Root>
  );
}
