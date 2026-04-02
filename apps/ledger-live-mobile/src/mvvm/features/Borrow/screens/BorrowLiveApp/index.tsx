import React, { type RefObject } from "react";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import GenericErrorView from "~/components/GenericErrorView";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { BorrowWebView } from "LLM/features/Borrow/components/BorrowWebView";
import type { BorrowWebviewInputs } from "./useBorrowLiveAppViewModel";
import type { AccountLike } from "@ledgerhq/types-live";

type BorrowLiveAppViewProps = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: BorrowWebviewInputs;
  accounts: AccountLike[];
};

export function BorrowLiveAppView({
  manifest,
  error,
  isLoading,
  webviewRef,
  onWebviewStateChange,
  webviewInputs,
  accounts,
}: BorrowLiveAppViewProps) {
  if (error) {
    return (
      <Flex flex={1} justifyContent="center" alignItems="center">
        {isLoading ? <InfiniteLoader /> : <GenericErrorView error={error} />}
      </Flex>
    );
  }

  return (
    <Flex flex={1} testID="borrow-screen">
      {manifest && (
        <BorrowWebView
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
