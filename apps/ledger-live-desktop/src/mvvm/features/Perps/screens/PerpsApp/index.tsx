import React from "react";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { PerpsWebView } from "LLD/features/Perps/screens/PerpsWebView";
import { usePerpsAppViewModel } from "./usePerpsAppViewModel";

export function PerpsApp() {
  const {
    manifest,
    refreshManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
  } = usePerpsAppViewModel();

  if (!manifest) {
    return <NetworkErrorScreen refresh={refreshManifests} type="warning" />;
  }

  return (
    <div className="flex size-full min-h-0 flex-1 flex-col justify-start">
      <PerpsWebView
        manifest={manifest}
        inputs={inputs}
        enablePlatformDevTools={enablePlatformDevTools}
        webviewAPIRef={webviewAPIRef}
        webviewState={webviewState}
        onStateChange={onStateChange}
      />
    </div>
  );
}
