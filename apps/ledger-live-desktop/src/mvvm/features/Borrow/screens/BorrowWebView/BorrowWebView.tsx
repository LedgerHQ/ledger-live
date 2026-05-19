import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { type RefObject } from "react";
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
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useBorrowWebViewViewModel } from "./useBorrowWebViewViewModel";

export type BorrowWebProps = {
  manifest: LiveAppManifest;
  inputs: BorrowWebviewInputs;
  webviewAPIRef: RefObject<WebviewAPI | null>;
  webviewState: WebviewState;
  onStateChange: WebviewProps["onStateChange"];
  enablePlatformDevTools: boolean;
  customHandlers?: WalletAPICustomHandlers;
  Loader?: WebviewLoader;
};

export const BorrowWebView = ({
  manifest,
  inputs,
  webviewAPIRef,
  webviewState,
  onStateChange,
  enablePlatformDevTools,
  customHandlers,
  Loader = BorrowLoader,
}: BorrowWebProps) => {
  const { mergedCustomHandlers } = useBorrowWebViewViewModel({ customHandlers });

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
          customHandlers={mergedCustomHandlers}
          onStateChange={onStateChange}
          ref={webviewAPIRef}
          Loader={Loader}
        />
      </div>
    </>
  );
};
