import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef, useCallback, useMemo } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SafeAreaView from "~/components/SafeAreaView";
import type { PerpsWebviewInputs } from "LLM/features/Perps/screens/PerpsLiveApp/usePerpsLiveAppViewModel";
import { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import type { AccountLike } from "@ledgerhq/types-live";
import { usePerpsHandlers } from "LLM/features/Perps/hooks/usePerpsHandlers";
import PerpsSignDrawer from "LLM/features/Perps/components/PerpsSignDrawer";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: PerpsWebviewInputs;
  accounts: AccountLike[];
};

export const PerpsWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs, accounts }, ref) => {
    const customDeeplinkHandlers = useDeeplinkCustomHandlers();
    const {
      handlers: customPerpsHandlers,
      signRequest,
      clearSignRequest,
    } = usePerpsHandlers(accounts);
    const customHandlers = useMemo<WalletAPICustomHandlers>(() => {
      return {
        ...customDeeplinkHandlers,
        ...customPerpsHandlers,
      };
    }, [customDeeplinkHandlers, customPerpsHandlers]);

    const signRequestId = signRequest?.id;
    const closeSignDrawer = useCallback(() => {
      if (signRequestId !== undefined) clearSignRequest(signRequestId);
    }, [clearSignRequest, signRequestId]);

    return (
      <SafeAreaView edges={["bottom"]} isFlex>
        <Web3AppWebview
          ref={ref}
          manifest={manifest}
          onStateChange={setWebviewState}
          inputs={inputs}
          customHandlers={customHandlers}
        />
        {signRequest && (
          <PerpsSignDrawer
            key={signRequest.id}
            request={signRequest.request}
            manifestId={manifest.id}
            manifestName={manifest.name}
            onClose={closeSignDrawer}
          />
        )}
      </SafeAreaView>
    );
  },
);
