import React from "react";
import { PerpsLiveAppView } from ".";
import { usePerpsLiveAppViewModel } from "LLM/features/Perps/screens/PerpsLiveApp/usePerpsLiveAppViewModel";

export function PerpsLiveAppWrapper() {
  const { manifest, error, isLoading, webviewRef, onWebviewStateChange, webviewInputs } =
    usePerpsLiveAppViewModel();

  return (
    <PerpsLiveAppView
      manifest={manifest}
      error={error}
      isLoading={isLoading}
      webviewRef={webviewRef}
      onWebviewStateChange={onWebviewStateChange}
      webviewInputs={webviewInputs}
    />
  );
}
