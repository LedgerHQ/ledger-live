import React from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "../../analytics/TrackScreen";
import GenericErrorView from "../../components/GenericErrorView";
import { useLocale } from "../../context/Locale";
import WebRecoverPlayer from "../../components/WebRecoverPlayer";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { ScreenName } from "../../const";

export type Props = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.Recover
>;

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

export function RecoverPlayer({ route }: Props) {
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
      <WebRecoverPlayer
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
