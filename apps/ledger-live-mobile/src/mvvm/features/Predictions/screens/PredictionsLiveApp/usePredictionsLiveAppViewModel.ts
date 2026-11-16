import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { FEATURE_FLAGS_DEFAULTS } from "@shared/feature-flags";
import { useFeature } from "@features/platform-feature-flags";
import { getPredictionsWebviewInputs } from "@features/platform-predictions";
import { useNetworkState } from "@shared/network-status";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import type { WalletAPICustomHandlers } from "@ledgerhq/live-common/wallet-api/types";
import { useTranslation } from "~/context/Locale";
import { useDeeplinkCustomHandlers } from "~/components/WebPlatformPlayer/CustomHandlers";
import { initialWebviewState } from "~/components/Web3AppWebview/helpers";
import type { WebviewAPI, WebviewState } from "~/components/Web3AppWebview/types";
import { usePredictionsHandlers } from "LLM/features/Predictions/hooks/usePredictionsHandlers";
import { useLiveAppWebviewInputs } from "LLM/hooks/useLiveAppWebviewInputs";
import type { ScreenName } from "~/const";
import type { PredictionsLiveAppNavigatorParamList } from "~/components/RootNavigator/types/PredictionsLiveAppNavigator";

export type PredictionsLiveAppViewModel = {
  manifest: LiveAppManifest | undefined;
  error: Error | null;
  isLoading: boolean;
  webviewInputs: Record<string, string | undefined>;
  customHandlers: WalletAPICustomHandlers;
  webviewRef: RefObject<WebviewAPI | null>;
  onWebviewStateChange: (state: WebviewState) => void;
  onBack: () => void;
};

const DEFAULT_MANIFEST_ID = FEATURE_FLAGS_DEFAULTS.ptxPredictionsLiveAppMobile.params?.manifest_id;

export function usePredictionsLiveAppViewModel(): PredictionsLiveAppViewModel {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { params: linkParams } =
    useRoute<RouteProp<PredictionsLiveAppNavigatorParamList, ScreenName.Predictions>>();
  const predictionsFlag = useFeature("ptxPredictionsLiveAppMobile");
  const { isConnected } = useNetworkState();
  const hostInputs = useLiveAppWebviewInputs();

  const manifestId = predictionsFlag?.params?.manifest_id || DEFAULT_MANIFEST_ID;
  const localManifest = useLocalLiveAppManifest(manifestId);
  const remoteManifest = useRemoteLiveAppManifest(manifestId);
  const manifest = localManifest ?? remoteManifest;
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();

  const webviewRef = useRef<WebviewAPI>(null);
  const [webviewState, setWebviewState] = useState<WebviewState>(initialWebviewState);

  useFocusEffect(
    useCallback(() => {
      if (!webviewState.canGoBack) return;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!webviewRef.current) return false;
        webviewRef.current.goBack();
        return true;
      });
      return () => subscription.remove();
    }, [webviewState.canGoBack]),
  );

  const deeplinkHandlers = useDeeplinkCustomHandlers();
  const predictionsHandlers = usePredictionsHandlers();
  const customHandlers = useMemo<WalletAPICustomHandlers>(
    () => ({ ...deeplinkHandlers, ...predictionsHandlers }),
    [deeplinkHandlers, predictionsHandlers],
  );

  const webviewInputs = useMemo(
    () => getPredictionsWebviewInputs(linkParams ?? {}, hostInputs),
    [hostInputs, linkParams],
  );

  const error = useMemo<Error | null>(() => {
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
    webviewInputs,
    customHandlers,
    webviewRef,
    onWebviewStateChange: setWebviewState,
    onBack: navigation.goBack,
  };
}
