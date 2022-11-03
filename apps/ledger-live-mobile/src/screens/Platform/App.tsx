import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import { AppManifest } from "@ledgerhq/live-common/platform/types";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";
import GenericErrorView from "../../components/GenericErrorView";
import { useLocale } from "../../context/Locale";
import { ScreenName } from "../../const";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ExchangeNavigatorParamList } from "../../components/RootNavigator/types/ExchangeNavigator";

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.
type Props =
  | StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PlatformApp>
  | StackNavigatorProps<
      ExchangeNavigatorParamList,
      ScreenName.ExchangeBuy | ScreenName.ExchangeSell
    >;

const PlatformApp = ({ route }: Props) => {
  const { theme } = useTheme();
  const { platform: appId, ...params } = route.params || {};
  const { setParams } = useNavigation<Props["navigation"]>();
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  const manifest = localManifest || remoteManifest;

  useEffect(() => {
    manifest?.name &&
      setParams({
        name: manifest.name,
      });
  }, [manifest, setParams]);

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer
        manifest={manifest as AppManifest}
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
};

export default PlatformApp;
