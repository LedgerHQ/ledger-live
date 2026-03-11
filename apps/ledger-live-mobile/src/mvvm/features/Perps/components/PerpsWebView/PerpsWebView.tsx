import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef, useMemo } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SafeAreaView from "~/components/SafeAreaView";
import type { PerpsWebviewInputs } from "LLM/features/Perps/screens/PerpsLiveApp/usePerpsLiveAppViewModel";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { AccountLike } from "@ledgerhq/types-live";
import { usePerpsHandlers } from "LLM/features/Perps/hooks/usePerpsHandlers";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: PerpsWebviewInputs;
  accounts: AccountLike[];
};

export const PerpsWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs, accounts }, ref) => {
    const customDeeplinkHandlers = useDeeplinkCustomHandlers();
    const customPerpsHandlers = usePerpsHandlers(accounts);
    const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
      return {
        ...customDeeplinkHandlers,
        ...customPerpsHandlers,
      };
    }, [customDeeplinkHandlers, customPerpsHandlers]);

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
