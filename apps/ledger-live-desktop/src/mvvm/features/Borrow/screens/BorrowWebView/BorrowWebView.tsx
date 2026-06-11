import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { useMemo, type RefObject } from "react";
import { Web3AppWebview } from "~/renderer/components/Web3AppWebview";
import {
  WebviewAPI,
  WebviewProps,
  WebviewState,
  WebviewLoader,
} from "~/renderer/components/Web3AppWebview/types";
import { TopBar } from "~/renderer/components/WebPlatformPlayer/TopBar";
import { BorrowLoader } from "LLD/features/Borrow/components/BorrowLoader";
import type { BorrowWebviewInputs } from "../BorrowApp/useBorrowAppViewModel";
import { useDeeplinkCustomHandlers } from "~/renderer/components/WebPlatformPlayer/CustomHandlers";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { createBorrowNavigateHandler } from "@ledgerhq/live-common/wallet-api/Borrow/navigate";
import type { BorrowSwapNavigationParams } from "@ledgerhq/live-common/wallet-api/Borrow/types";

export type BorrowWebProps = {
  manifest: LiveAppManifest;
  inputs: BorrowWebviewInputs;
  webviewAPIRef: RefObject<WebviewAPI | null>;
  webviewState: WebviewState;
  onStateChange: WebviewProps["onStateChange"];
  enablePlatformDevTools: boolean;
  onWalletApiGoBack?: () => void;
  onWalletApiGoToSwap?: (params: BorrowSwapNavigationParams) => void;
  Loader?: WebviewLoader;
};

export const BorrowWebView = ({
  manifest,
  inputs,
  webviewAPIRef,
  webviewState,
  onStateChange,
  enablePlatformDevTools,
  onWalletApiGoBack,
  onWalletApiGoToSwap,
  Loader = BorrowLoader,
}: BorrowWebProps) => {
  const customDeeplinkHandlers = useDeeplinkCustomHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({
      ...customDeeplinkHandlers,
      "custom.navigate": createBorrowNavigateHandler({
        onGoBack: onWalletApiGoBack,
        onGoToSwap: onWalletApiGoToSwap,
      }),
    }),
    [customDeeplinkHandlers, onWalletApiGoBack, onWalletApiGoToSwap],
  );

  return (
    <>
      {enablePlatformDevTools && (
        <TopBar manifest={manifest} webviewAPIRef={webviewAPIRef} webviewState={webviewState} />
      )}

      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Web3AppWebview
          manifest={manifest}
          inputs={{
            ...inputs,
          }}
          customHandlers={customHandlers}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          Loader={Loader}
        />
      </div>
    </>
  );
};
