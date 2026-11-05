import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";
import { getPredictionsWebviewInputs } from "@features/platform-predictions";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useSelector } from "LLD/hooks/redux";
import { useLiveAppWebviewInputs } from "LLD/hooks/useLiveAppWebviewInputs";
import { usePredictionsHandlers } from "LLD/features/Predictions/hooks/usePredictionsHandlers";
import { initialWebviewState } from "~/renderer/components/Web3AppWebview/helpers";
import { WebviewAPI, WebviewState } from "~/renderer/components/Web3AppWebview/types";
import { useDeeplinkCustomHandlers } from "~/renderer/components/WebPlatformPlayer/CustomHandlers";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";

type PredictionsLocationState = { returnTo?: string } & Record<string, string | undefined>;

const DEFAULT_MANIFEST_ID = FEATURE_FLAGS_DEFAULTS.ptxPredictionsLiveAppDesktop.params?.manifest_id;

export function usePredictionsAppViewModel() {
  const predictionsFlag = useFeature("ptxPredictionsLiveAppDesktop");
  const manifestId = predictionsFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;

  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest || remoteManifest;

  const { state: liveAppCatalog, updateManifests } = useRemoteLiveAppContext();

  const webviewAPIRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);
  const hostInputs = useLiveAppWebviewInputs();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as PredictionsLocationState | null;
  const returnTo = locationState?.returnTo ?? "/";

  const onBack = useCallback(() => {
    navigate(returnTo, { replace: true });
  }, [navigate, returnTo]);

  const deeplinkHandlers = useDeeplinkCustomHandlers();
  const predictionsHandlers = usePredictionsHandlers(onBack);
  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({ ...deeplinkHandlers, ...predictionsHandlers }),
    [deeplinkHandlers, predictionsHandlers],
  );

  const inputs = useMemo(
    () =>
      getPredictionsWebviewInputs(
        Object.fromEntries(
          Object.entries(locationState ?? {}).filter(([key]) => key !== "returnTo"),
        ),
        hostInputs,
      ),
    [hostInputs, locationState],
  );

  return {
    manifest,
    isCatalogLoading: !liveAppCatalog.value && !liveAppCatalog.error,
    refreshManifests: updateManifests,
    inputs,
    customHandlers,
    enablePlatformDevTools,
    webviewAPIRef,
    webviewState,
    onStateChange: setWebviewState,
  };
}
