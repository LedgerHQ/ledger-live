import { useCallback, useMemo, useRef, useState } from "react";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useNetworkState } from "@shared/network-status";
import { useTranslation } from "~/context/Locale";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { useBorrowLiveConfig } from "LLM/features/Borrow/hooks/useBorrowLiveConfig";
import {
  useLiveAppWebviewInputs,
  type LiveAppWebviewInputs,
} from "LLM/hooks/useLiveAppWebviewInputs";
import type { RefObject } from "react";

type BorrowLiveAppViewModel = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewState: WebviewState;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  webviewInputs: LiveAppWebviewInputs;
};

const DEFAULT_MANIFEST_ID =
  FEATURE_FLAGS_DEFAULTS.ptxBorrowLiveApp?.params?.manifest_id ?? "borrow";

export function useBorrowLiveAppViewModel(): BorrowLiveAppViewModel {
  const { t } = useTranslation();
  const borrowConfig = useBorrowLiveConfig();
  const { isConnected } = useNetworkState();
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const webviewInputs = useLiveAppWebviewInputs();

  const webviewRef = useRef<WebviewAPI>(null);

  const borrowManifestId = borrowConfig?.params?.manifest_id ?? DEFAULT_MANIFEST_ID;

  const localManifest: LiveAppManifest | undefined = useLocalLiveAppManifest(
    borrowManifestId || undefined,
  );
  const remoteManifest: LiveAppManifest | undefined = useRemoteLiveAppManifest(
    borrowManifestId || undefined,
  );
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const manifest = useMemo<LiveAppManifest | undefined>(
    () => localManifest ?? remoteManifest,
    [localManifest, remoteManifest],
  );

  const onWebviewStateChange = useCallback((state: WebviewState) => {
    setWebviewState(state);
  }, []);

  const error: Error | null = useMemo(() => {
    const hasError = !manifest || isConnected === false;
    if (!hasError) return null;

    if (isConnected === false) {
      return new Error(t("errors.WebPTXPlayerNetworkFail.title"));
    }
    if (!manifest) {
      return new Error(t("errors.AppManifestUnknownError.title"));
    }

    return null;
  }, [manifest, isConnected, t]);

  return {
    manifest,
    error,
    isLoading: remoteLiveAppState.isLoading,
    webviewState,
    webviewRef,
    onWebviewStateChange,
    webviewInputs,
  };
}
