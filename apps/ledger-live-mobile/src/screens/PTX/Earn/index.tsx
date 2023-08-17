import React from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "../../../analytics/TrackScreen";
import GenericErrorView from "../../../components/GenericErrorView";
import { WebPTXPlayer } from "../../../components/WebPTXPlayer";
import { EarnLiveAppNavigatorParamList } from "../../../components/RootNavigator/types/EarnLiveAppNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  languageSelector,
  localeSelector,
} from "../../../reducers/settings";
import { useSelector } from "react-redux";
import { TAB_BAR_HEIGHT } from "../../../components/TabBar/shared";

export type Props = StackNavigatorProps<EarnLiveAppNavigatorParamList, ScreenName.Earn>;

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.
const DEFAULT_EARN_APP_ID = "earn";

export function EarnScreen({ route }: Props) {
  const { theme } = useTheme();
  const language = useSelector(languageSelector);
  const locale = useSelector(localeSelector);
  const { ticker: currencyTicker } = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);

  const { platform: appId, ...params } = route.params || {};
  const searchParams = route.path
    ? new URL("ledgerlive://" + route.path).searchParams
    : new URLSearchParams();

  const localManifest = useLocalLiveAppManifest(DEFAULT_EARN_APP_ID);
  const remoteManifest = useRemoteLiveAppManifest(DEFAULT_EARN_APP_ID);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const manifest = localManifest || remoteManifest;

  return manifest ? (
    <Flex
      /**
       * NB: not using SafeAreaView because it flickers during navigation
       * https://github.com/th3rdwave/react-native-safe-area-context/issues/219
       */
      flex={1}
      mb={TAB_BAR_HEIGHT}
    >
      <TrackScreen category="EarnDashboard" name="Earn" />
      <WebPTXPlayer
        manifest={manifest}
        disableHeader
        inputs={{
          theme,
          lang: language,
          locale: locale,
          currencyTicker,
          discreetMode: discreet ? "true" : "false",
          ...params,
          ...Object.fromEntries(searchParams.entries()),
        }}
      />
    </Flex>
  ) : (
    <Flex flex={1} p={10} justifyContent="center" alignItems="center">
      {remoteLiveAppState.isLoading ? (
        <InfiniteLoader />
      ) : (
        <GenericErrorView error={appManifestNotFoundError} />
      )}
    </Flex>
  );
}
