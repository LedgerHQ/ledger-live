import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { BorrowLiveAppView } from ".";
import { useBorrowLiveAppViewModel } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { useCustomExchangeHandlers } from "src/components/WebPTXPlayer/CustomHandlers";
import { useSelector } from "src/context/hooks";
import { flattenAccountsSelector } from "src/reducers/accounts";
import { sendBorrowLiveAppReady } from "e2e/bridge/client";
import GenericErrorView from "src/components/GenericErrorView";

type BorrowLiveAppWrapperProps = Readonly<{
  action?: "go-back";
  onNativeGoBack?: () => void;
  onActionHandled?: () => void;
}>;

const appManifestNotFoundError = new Error("Borrow App not found");

export function BorrowLiveAppWrapper({
  action,
  onNativeGoBack,
  onActionHandled,
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

  if (!manifest) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        <GenericErrorView error={appManifestNotFoundError} />
      </Flex>
    );
  }

  const isSetupAmountStep = webviewState.url.includes("/loan");
  const accounts = useSelector(flattenAccountsSelector);
  const customHandlers = useCustomExchangeHandlers({
    manifest,
    accounts,
    sendAppReady: sendBorrowLiveAppReady,
  });

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
