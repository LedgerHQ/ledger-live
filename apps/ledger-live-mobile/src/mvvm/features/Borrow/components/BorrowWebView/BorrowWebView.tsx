import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef, useMemo } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import type { BorrowWebviewInputs } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: BorrowWebviewInputs;
};

export const BorrowWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs }, ref) => {
    const customDeeplinkHandlers = useDeeplinkCustomHandlers();
    const customHandlers = useMemo<WalletAPICustomHandlers>(
      () => ({ ...customDeeplinkHandlers }),
      [customDeeplinkHandlers],
    );

    return (
      <Web3AppWebview
        ref={ref}
        manifest={manifest}
        onStateChange={setWebviewState}
        inputs={inputs}
        customHandlers={customHandlers}
      />
    );
  },
);
