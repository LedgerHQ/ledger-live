import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import type { StackScreenProps } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";
import GenericErrorView from "../../components/GenericErrorView";
import { useLocale } from "../../context/Locale";

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

const PlatformApp = ({ route }: StackScreenProps) => {
  const { theme } = useTheme();
  const { platform: appId, ...params } = route.params;
  const { setParams } = useNavigation();
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
};

export default PlatformApp;
