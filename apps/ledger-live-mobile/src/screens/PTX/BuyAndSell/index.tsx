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
import { useLocale } from "../../../context/Locale";
import { WebPTXPlayer } from "../../../components/WebPTXPlayer";
import { ExchangeNavigatorParamList } from "../../../components/RootNavigator/types/ExchangeNavigator";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../../const";

export type Props = StackNavigatorProps<
  ExchangeNavigatorParamList,
  ScreenName.ExchangeBuy | ScreenName.ExchangeSell
>;

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

export function BuyAndSellScreen({ route }: Props) {
  const { theme } = useTheme();
  const { platform: appId, ...params } = route.params || {};
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  const manifest = localManifest || remoteManifest;

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPTXPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
          ...params,
        }}
      />
    </>
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
