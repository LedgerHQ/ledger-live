import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SafeAreaView from "~/components/SafeAreaView";
import type { PerpsWebviewInputs } from "LLM/features/Perps/screens/PerpsLiveApp/usePerpsLiveAppViewModel";

type Props = {
  manifest: LiveAppManifest;
  setWebviewState: (webviewState: WebviewState) => void;
  inputs: PerpsWebviewInputs;
};

export const PerpsWebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, setWebviewState, inputs }, ref) => {
    return (
      <SafeAreaView edges={["bottom"]} isFlex>
        <Web3AppWebview
          ref={ref}
          manifest={manifest}
          onStateChange={setWebviewState}
          inputs={inputs}
        />
      </SafeAreaView>
    );
  },
);
