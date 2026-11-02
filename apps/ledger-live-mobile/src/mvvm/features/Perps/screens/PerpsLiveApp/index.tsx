import React, { type RefObject } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { PerpsWebView } from "LLM/features/Perps/components/PerpsWebView";
import type { PerpsWebviewInputs } from "./usePerpsLiveAppViewModel";
import type { AccountLike } from "@ledgerhq/types-live";

type PerpsLiveAppViewProps = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: PerpsWebviewInputs;
  accounts: AccountLike[];
};

export function PerpsLiveAppView({
  manifest,
  error,
  isLoading,
  webviewRef,
  onWebviewStateChange,
  webviewInputs,
  accounts,
}: PerpsLiveAppViewProps) {
  if (error) {
    return (
      <Box lx={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {isLoading ? <Spinner /> : <GenericErrorView error={error} />}
      </Box>
    );
  }

  return (
    <Box lx={{ flex: 1 }} testID="perps-tab">
      {manifest && (
        <PerpsWebView
          ref={webviewRef}
          manifest={manifest}
          setWebviewState={onWebviewStateChange}
          inputs={webviewInputs}
          accounts={accounts}
        />
      )}
    </Box>
  );
}
