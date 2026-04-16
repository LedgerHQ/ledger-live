import React, { type RefObject } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { BorrowWebView } from "LLM/features/Borrow/components/BorrowWebView";
import { useWallet40Theme } from "~/mvvm/hooks/useWallet40Theme";
import type { BorrowWebviewInputs } from "./useBorrowLiveAppViewModel";

type BorrowLiveAppViewProps = Readonly<{
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: BorrowWebviewInputs;
}>;

export function BorrowLiveAppView({
  manifest,
  error,
  isLoading,
  webviewRef,
  onWebviewStateChange,
  webviewInputs,
}: BorrowLiveAppViewProps) {
  const { backgroundColor } = useWallet40Theme("mobile");

  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="borrow-screen" backgroundColor={backgroundColor}>
      {manifest && (
        <BorrowWebView
          ref={webviewRef}
          manifest={manifest}
          setWebviewState={onWebviewStateChange}
          inputs={webviewInputs}
        />
      )}
    </Flex>
  );
}
