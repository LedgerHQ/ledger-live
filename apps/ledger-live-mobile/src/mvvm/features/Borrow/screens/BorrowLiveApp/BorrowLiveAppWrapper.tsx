import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import React, { useEffect, useMemo } from "react";
import { BorrowLiveAppView } from ".";
import { useBorrowLiveAppViewModel } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";

type BorrowLiveAppWrapperProps = Readonly<{
  action?: "go-back";
  onNativeGoBack?: () => void;
  onActionHandled?: () => void;
  onWalletApiGoBack?: () => void;
}>;

export function BorrowLiveAppWrapper({
  action,
  onNativeGoBack,
  onActionHandled,
  onWalletApiGoBack,
}: BorrowLiveAppWrapperProps) {
  const { manifest, error, isLoading, webviewRef, webviewState, onWebviewStateChange, webviewInputs } =
    useBorrowLiveAppViewModel();
  const isSetupAmountStep = webviewState.url.includes("/loan");

  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      "custom.borrow.navigate": async (request: { params?: { action?: string } }) => {
        const requestAction = request.params?.action;

        if (requestAction !== "go-back") {
          throw new Error("Unknown borrow navigation action");
        }

        onWalletApiGoBack?.();
        return { success: true };
      },
    }),
    [onWalletApiGoBack],
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
