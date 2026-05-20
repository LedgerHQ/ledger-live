import React, { useEffect } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { BorrowLiveAppView } from ".";
import {
  useBorrowLiveAppViewModel,
  type BorrowWebviewInputs,
} from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { useCustomExchangeHandlers } from "~/components/WebPTXPlayer/CustomHandlers";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { sendBorrowLiveAppReady } from "../../../../../../e2e/bridge/client";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { RefObject } from "react";

type BorrowLiveAppWrapperProps = Readonly<{
  action?: "go-back";
  onNativeGoBack?: () => void;
  onActionHandled?: () => void;
}>;

type BorrowLiveAppContentProps = Readonly<{
  manifest: LiveAppManifest;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  webviewState: WebviewState;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: BorrowWebviewInputs;
  action?: "go-back";
  onNativeGoBack?: () => void;
  onActionHandled?: () => void;
}>;

const appManifestNotFoundError = new Error("Borrow App not found");

function BorrowLiveAppContent({
  manifest,
  error,
  isLoading,
  webviewRef,
  webviewState,
  onWebviewStateChange,
  webviewInputs,
  action,
  onNativeGoBack,
  onActionHandled,
}: BorrowLiveAppContentProps) {
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

  return (
    <BorrowLiveAppContent
      manifest={manifest}
      error={error}
      isLoading={isLoading}
      webviewRef={webviewRef}
      webviewState={webviewState}
      onWebviewStateChange={onWebviewStateChange}
      webviewInputs={webviewInputs}
      action={action}
      onNativeGoBack={onNativeGoBack}
      onActionHandled={onActionHandled}
    />
  );
}
