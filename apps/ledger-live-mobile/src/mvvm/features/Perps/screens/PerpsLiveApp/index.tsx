import React, { type RefObject } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { PerpsWebView } from "LLM/features/Perps/components/PerpsWebView";
import type { PerpsWebviewInputs } from "./usePerpsLiveAppViewModel";

type PerpsLiveAppViewProps = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: PerpsWebviewInputs;
};

export function PerpsLiveAppView({
  manifest,
  error,
  isLoading,
  webviewRef,
  onWebviewStateChange,
  webviewInputs,
}: PerpsLiveAppViewProps) {
  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="perps-tab">
      {manifest && (
        <PerpsWebView
          ref={webviewRef}
          manifest={manifest}
          setWebviewState={onWebviewStateChange}
          inputs={webviewInputs}
        />
      )}
    </Flex>
  );
}
