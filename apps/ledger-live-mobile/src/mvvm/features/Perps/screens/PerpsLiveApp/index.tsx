import React, { type RefObject } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { PerpsWebView } from "LLM/features/Perps/components/PerpsWebView";
import { useWallet40Theme } from "LLM/hooks/useWallet40Theme";
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
  const { backgroundColor } = useWallet40Theme();

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="perps-tab" backgroundColor={backgroundColor}>
      {manifest && (
        <PerpsWebView
          ref={webviewRef}
          manifest={manifest}
          setWebviewState={onWebviewStateChange}
          inputs={webviewInputs}
          accounts={accounts}
        />
      )}
    </Flex>
  );
}
