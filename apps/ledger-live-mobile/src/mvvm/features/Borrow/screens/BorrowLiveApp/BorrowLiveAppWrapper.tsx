import React from "react";
import { BorrowLiveAppView } from ".";
import { useBorrowLiveAppViewModel } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";

export function BorrowLiveAppWrapper() {
  const { manifest, error, isLoading, webviewRef, onWebviewStateChange, webviewInputs, accounts } =
    useBorrowLiveAppViewModel();

  return (
    <BorrowLiveAppView
      manifest={manifest}
      error={error}
      isLoading={isLoading}
      webviewRef={webviewRef}
      onWebviewStateChange={onWebviewStateChange}
      webviewInputs={webviewInputs}
      accounts={accounts}
    />
  );
}
