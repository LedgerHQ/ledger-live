import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef, useMemo } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SafeAreaView from "~/components/SafeAreaView";
import type { BorrowWebviewInputs } from "LLM/features/Borrow/screens/BorrowLiveApp/useBorrowLiveAppViewModel";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import type { AccountLike } from "@ledgerhq/types-live";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: BorrowWebviewInputs;
  accounts: AccountLike[];
};

export const BorrowWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs }, ref) => {
    const customDeeplinkHandlers = useDeeplinkCustomHandlers();
    const customHandlers = useMemo<WalletAPICustomHandlers>(
      () => ({ ...customDeeplinkHandlers }),
      [customDeeplinkHandlers],
    );

    return (
      <SafeAreaView edges={["bottom"]} isFlex>
        <Web3AppWebview
          ref={ref}
          manifest={manifest}
          onStateChange={setWebviewState}
          inputs={inputs}
          customHandlers={customHandlers}
        />
      </SafeAreaView>
    );
  },
);
