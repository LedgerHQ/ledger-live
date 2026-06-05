import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { createBorrowNavigateHandler } from "@ledgerhq/live-common/wallet-api/Borrow/navigate";
import type { BorrowSwapNavigationParams } from "@ledgerhq/live-common/wallet-api/Borrow/types";
import React, { useEffect, useMemo } from "react";
import { BorrowLiveAppView } from ".";
import { useBorrowLiveAppViewModel } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";

type BorrowLiveAppWrapperProps = Readonly<{
  action?: "go-back";
  onNativeGoBack?: () => void;
  onActionHandled?: () => void;
  onWalletApiGoBack?: () => void;
  onWalletApiGoToSwap?: (params: BorrowSwapNavigationParams) => void;
}>;

export function BorrowLiveAppWrapper({
  action,
  onNativeGoBack,
  onActionHandled,
  onWalletApiGoBack,
  onWalletApiGoToSwap,
}: BorrowLiveAppWrapperProps) {
  const {
    manifest,
    error,
    isLoading,
    webviewRef,
    webviewState,
    onWebviewStateChange,
    webviewInputs,
  } = useBorrowLiveAppViewModel();
  const isSetupAmountStep = webviewState.url.includes("/loan");

  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      "custom.navigate": createBorrowNavigateHandler({
        onGoBack: onWalletApiGoBack,
        onGoToSwap: onWalletApiGoToSwap,
      }),
    }),
    [onWalletApiGoBack, onWalletApiGoToSwap],
  );

  useEffect(() => {
    if (action !== "go-back") {
      return;
    }

    if (webviewState.canGoBack && isSetupAmountStep) {
      webviewRef.current?.goBack();
    } else {
      onNativeGoBack?.();
    }

    onActionHandled?.();
  }, [
    action,
    isSetupAmountStep,
    onActionHandled,
    onNativeGoBack,
    webviewRef,
    webviewState.canGoBack,
  ]);

  return (
    <BorrowLiveAppView
      manifest={manifest}
      error={error}
      isLoading={isLoading}
      webviewRef={webviewRef}
      onWebviewStateChange={onWebviewStateChange}
      webviewInputs={webviewInputs}
      customHandlers={customHandlers}
    />
  );
}
