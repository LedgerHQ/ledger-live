import React from "react";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { BorrowWebView } from "LLD/features/Borrow/screens/BorrowWebView";
import { useBorrowAppViewModel } from "./useBorrowAppViewModel";

export function BorrowApp() {
  const {
    manifest,
    refreshManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
    onBack,
    onGoToSwap,
  } = useBorrowAppViewModel();

  if (!manifest) {
    return <NetworkErrorScreen refresh={refreshManifests} type="warning" />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <BorrowWebView
        manifest={manifest}
        inputs={inputs}
        enablePlatformDevTools={enablePlatformDevTools}
        webviewAPIRef={webviewAPIRef}
        webviewState={webviewState}
        onStateChange={onStateChange}
        onWalletApiGoBack={onBack}
        onWalletApiGoToSwap={onGoToSwap}
      />
    </div>
  );
}
