import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSwapLiveConfig } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import SwapWebView from "~/renderer/screens/exchange/Swap2/Form/SwapWebViewDemo3";

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_SWAP_MANIFEST_ID || DEFAULT_FEATURES.ptxSwapLiveApp.params?.manifest_id;

type WebViewType = "embedded" | "fullpage";

type SwapWebViewManagerContextType = {
  manifest: LiveAppManifest | null;
  isManifestLoaded: boolean;
  registerTarget: (type: WebViewType, element: HTMLElement, urlKey?: string) => void;
  unregisterTarget: (type: WebViewType) => void;
};

const SwapWebViewManagerContext = createContext<SwapWebViewManagerContextType | null>(null);

export const useSwapWebViewManager = () => {
  const context = useContext(SwapWebViewManagerContext);
  if (!context) {
    throw new Error("useSwapWebViewManager must be used within SwapWebViewManagerProvider");
  }
  return context;
};

/**
 * This component renders the actual webviews.
 * It stays mounted for the entire app lifetime.
 *
 * Uses URL keys to force remount when deep link params change.
 */
const WebViewPortalRenderer: React.FC<{
  manifest: LiveAppManifest;
  embeddedTarget: HTMLElement | null;
  fullpageTarget: HTMLElement | null;
  fullpageUrlKey: string;
}> = ({ manifest, embeddedTarget, fullpageTarget, fullpageUrlKey }) => {
  const [embeddedPosition, setEmbeddedPosition] = useState<DOMRect | null>(null);
  const [fullpagePosition, setFullpagePosition] = useState<DOMRect | null>(null);

  // Track embedded target position
  useEffect(() => {
    if (!embeddedTarget) {
      setEmbeddedPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = embeddedTarget.getBoundingClientRect();
      setEmbeddedPosition(rect);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [embeddedTarget]);

  // Track fullpage target position
  useEffect(() => {
    if (!fullpageTarget) {
      setFullpagePosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = fullpageTarget.getBoundingClientRect();
      setFullpagePosition(rect);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [fullpageTarget]);

  return createPortal(
    <>
      {/* Embedded webview - ALWAYS RENDERED, just hidden when no target */}
      <div
        style={{
          position: "fixed",
          display: embeddedPosition ? "flex" : "none",
          flexDirection: "column",
          top: embeddedPosition?.top ?? 0,
          left: embeddedPosition?.left ?? 0,
          width: embeddedPosition?.width ?? 0,
          height: embeddedPosition?.height ?? 0,
          pointerEvents: embeddedPosition ? "auto" : "none",
        }}
      >
        <SwapWebView manifest={manifest} isEmbedded />
      </div>

      {/* Fullpage webview - REMOUNTS when URL key changes (deep links) */}
      <div
        style={{
          position: "fixed",
          display: fullpagePosition ? "flex" : "none",
          flexDirection: "column",
          top: fullpagePosition?.top ?? 0,
          left: fullpagePosition?.left ?? 0,
          width: fullpagePosition?.width ?? 0,
          height: fullpagePosition?.height ?? 0,
          pointerEvents: fullpagePosition ? "auto" : "none",
        }}
      >
        <SwapWebView key={fullpageUrlKey} manifest={manifest} />
      </div>
    </>,
    document.body,
  );
};

/**
 * Provider that manages webview lifecycle and portals.
 * This component stays mounted for the entire app lifetime.
 */
export const SwapWebViewManagerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [embeddedTarget, setEmbeddedTarget] = useState<HTMLElement | null>(null);
  const [fullpageTarget, setFullpageTarget] = useState<HTMLElement | null>(null);
  const [fullpageUrlKey, setFullpageUrlKey] = useState<string>("");

  // Load manifest once at provider level
  const swapLiveEnabledFlag = useSwapLiveConfig();
  const swapLiveAppManifestID = swapLiveEnabledFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;
  const localManifest = useLocalLiveAppManifest(swapLiveAppManifestID || undefined);
  const remoteManifest = useRemoteLiveAppManifest(swapLiveAppManifestID || undefined);
  const manifest = localManifest || remoteManifest;

  const registerTarget = useCallback((type: WebViewType, element: HTMLElement, urlKey?: string) => {
    if (type === "embedded") {
      setEmbeddedTarget(element);
    } else {
      setFullpageTarget(element);
      // Update URL key for fullpage - this will force remount if URL changed
      if (urlKey) {
        setFullpageUrlKey(urlKey);
      }
    }
  }, []);

  const unregisterTarget = useCallback((type: WebViewType) => {
    if (type === "embedded") {
      setEmbeddedTarget(null);
    } else {
      setFullpageTarget(null);
    }
  }, []);

  const contextValue: SwapWebViewManagerContextType = {
    manifest: manifest || null,
    isManifestLoaded: !!manifest,
    registerTarget,
    unregisterTarget,
  };

  return (
    <SwapWebViewManagerContext.Provider value={contextValue}>
      {children}
      {/* Render webviews via portals - this component never unmounts! */}
      {manifest && (
        <WebViewPortalRenderer
          manifest={manifest}
          embeddedTarget={embeddedTarget}
          fullpageTarget={fullpageTarget}
          fullpageUrlKey={fullpageUrlKey}
        />
      )}
    </SwapWebViewManagerContext.Provider>
  );
};
