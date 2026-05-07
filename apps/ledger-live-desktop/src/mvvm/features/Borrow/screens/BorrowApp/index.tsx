import React from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "LLD/components/PageHeader";
import { NetworkErrorScreen } from "~/renderer/components/Web3AppWebview/NetworkError";
import { BorrowWebView } from "LLD/features/Borrow/screens/BorrowWebView";
import { useBorrowAppViewModel } from "./useBorrowAppViewModel";

export function BorrowApp() {
  const { t } = useTranslation();
  const {
    manifest,
    refreshManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
    onBack,
  } = useBorrowAppViewModel();

  if (!manifest) {
    return <NetworkErrorScreen refresh={refreshManifests} type="warning" />;
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <PageHeader title={t("borrow.pageHeader")} onBack={onBack} />
      <BorrowWebView
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
