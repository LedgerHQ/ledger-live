import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { BorrowWebviewInputs } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useBorrowWebViewViewModel } from "./useBorrowWebViewViewModel";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: BorrowWebviewInputs;
  customHandlers?: WalletAPICustomHandlers;
};

export const BorrowWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs, customHandlers }, ref) => {
    const { mergedCustomHandlers } = useBorrowWebViewViewModel({ customHandlers });

    return (
      <Web3AppWebview
        ref={ref}
        manifest={manifest}
        onStateChange={setWebviewState}
        inputs={inputs}
        customHandlers={mergedCustomHandlers}
      />
    );
  },
);
