import { useCallback } from "react";
import type { RefObject } from "react";
import { safeGetRefValue } from "@ledgerhq/live-common/wallet-api/react";
import type { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import type { WebviewAPI } from "~/components/Web3AppWebview/types";

export type HeaderViewModelValues = {
  shouldDisplaySelectAccount: boolean;
  onForward: () => void;
  onBack: () => void;
  onReload: () => void;
  onInfoPanel: () => void;
};

type Params = {
  webviewAPIRef: RefObject<WebviewAPI | null>;
  manifest: AppManifest;
  setIsInfoPanelOpened: (isOpened: boolean) => void;
};

export default function useHeaderViewModel({
  webviewAPIRef,
  manifest,
  setIsInfoPanelOpened,
}: Params): HeaderViewModelValues {
  const shouldDisplaySelectAccount = !!manifest.dapp;

  const onForward = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);
    webview.goForward();
  }, [webviewAPIRef]);

  const onBack = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);
    webview.goBack();
  }, [webviewAPIRef]);

  const onReload = useCallback(() => {
    const webview = safeGetRefValue(webviewAPIRef);
    webview.reload();
  }, [webviewAPIRef]);

  const onInfoPanel = useCallback(() => {
    setIsInfoPanelOpened(true);
  }, [setIsInfoPanelOpened]);

  return {
    shouldDisplaySelectAccount,
    onForward,
    onBack,
    onReload,
    onInfoPanel,
  };
}
