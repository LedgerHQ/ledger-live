import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import React, { forwardRef } from "react";
import { Web3AppWebview } from "~/components/Web3AppWebview";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import SafeAreaView from "~/components/SafeAreaView";
import { DefaultAccountSwapParamList } from "../types";
import { useSwapWebviewProps } from "./hooks/useSwapWebviewProps";

type Props = {
  manifest: LiveAppManifest;
  params: DefaultAccountSwapParamList | null;
  setWebviewState: (webviewState: WebviewState) => void;
};

export const WebView = forwardRef<WebviewAPI, Props>(
  ({ manifest, params, setWebviewState }, ref) => {
    const { customHandlers, inputs } = useSwapWebviewProps({ manifest, params });

    return (
      <SafeAreaView edges={["bottom"]} isFlex>
        <Web3AppWebview
          ref={ref}
          manifest={manifest}
          customHandlers={customHandlers}
          onStateChange={setWebviewState}
          inputs={inputs}
        />
      </SafeAreaView>
    );
  },
);
