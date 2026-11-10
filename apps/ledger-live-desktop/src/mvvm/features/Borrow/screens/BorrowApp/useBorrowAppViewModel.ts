import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { useSelector } from "LLD/hooks/redux";
import { useLiveAppWebviewInputs } from "LLD/hooks/useLiveAppWebviewInputs";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { useBorrowLiveConfig } from "LLD/features/Borrow/hooks/useBorrowLiveConfig";
import { useBorrowLifecycleMonitoring } from "~/renderer/analytics/useBorrowLifecycleMonitoring";
import type { BorrowSwapNavigationParams } from "@ledgerhq/live-common/wallet-api/Borrow/types";

type BorrowLocationState = { returnTo?: string };

const DEFAULT_MANIFEST_ID =
  process.env.DEFAULT_BORROW_MANIFEST_ID ||
  FEATURE_FLAGS_DEFAULTS.ptxBorrowLiveApp?.params?.manifest_id ||
  "borrow";

export function useBorrowAppViewModel() {
  const borrowFlag = useBorrowLiveConfig();
  const manifestId = borrowFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;
  useBorrowLifecycleMonitoring(manifestId);

  const localManifest = useLocalLiveAppManifest(manifestId || undefined);
  const remoteManifest = useRemoteLiveAppManifest(manifestId || undefined);
  const manifest = localManifest || remoteManifest;

  const { updateManifests } = useRemoteLiveAppContext();

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const inputs = useLiveAppWebviewInputs();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as BorrowLocationState | null;
  // Persist initial returnTo in a ref so it survives in-webview navigations that push
  // new React Router locations and overwrite location.state.
  const returnToRef = useRef<string | null>(null);
  useEffect(() => {
    const value = locationState?.returnTo;
    if (returnToRef.current === null && value != null && value !== "") {
      returnToRef.current = value;
    }
  }, [locationState?.returnTo]);
  const returnTo = returnToRef.current ?? locationState?.returnTo ?? "/";

  const onBack = useCallback(() => {
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const onGoToSwap = useCallback(
    (swapParams: BorrowSwapNavigationParams) => {
      const {
        fromCurrencyId,
        toCurrencyId,
        fromTokenId,
        toTokenId,
        fromAccountId,
        toAccountId,
        amountFrom,
        affiliate,
      } = swapParams;

      const defaultCurrency =
        fromCurrencyId || toCurrencyId ? { fromCurrencyId, toCurrencyId } : undefined;
      const defaultToken = fromTokenId || toTokenId ? { fromTokenId, toTokenId } : undefined;
      const defaultAccountId =
        fromAccountId || toAccountId ? { fromAccountId, toAccountId } : undefined;

      navigate("/swap", {
        state: {
          defaultCurrency,
          defaultToken,
          defaultAccountId,
          defaultAmountFrom: amountFrom,
          affiliate,
          from: location.pathname,
        },
      });
    },
    [navigate, location.pathname],
  );

  const onStateChange = (state: WebviewState) => {
    setWebviewState(state);
  };

  return {
    manifest,
    refreshManifests: updateManifests,
    inputs,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange,
    onBack,
    onGoToSwap,
  };
}
