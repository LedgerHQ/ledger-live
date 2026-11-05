import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { usePredictionsAppViewModel } from "./usePredictionsAppViewModel";

export function PredictionsApp() {
  const {
    manifest,
    isCatalogLoading,
    refreshManifests,
    inputs,
    customHandlers,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
  } = usePredictionsAppViewModel();

  if (!manifest && isCatalogLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner size={48} />
      </div>
    );
  }

  if (!manifest) {
    return <NetworkErrorScreen refresh={refreshManifests} type="warning" />;
  }

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      data-testid="predictions-app"
    >
      {enablePlatformDevTools && (
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
      )}
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Web3AppWebview
          manifest={manifest}
          inputs={inputs}
          customHandlers={customHandlers}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
        />
      </div>
    </div>
  );
}
