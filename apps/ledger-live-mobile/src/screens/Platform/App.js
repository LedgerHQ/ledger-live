// @flow

import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import type { StackScreenProps } from "@react-navigation/stack";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";
import GenericErrorView from "../../components/GenericErrorView";

const appManifestNotFoundError = new Error("App not found");

const PlatformApp = ({ route }: StackScreenProps) => {
  const { dark } = useTheme();
  const { platform: appId, ...params } = route.params;
  const { setParams } = useNavigation();
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const manifest = localManifest || remoteManifest;
  useEffect(() => {
    manifest?.name && setParams({ name: manifest.name });
  }, [manifest, setParams]);
  const themeType = dark ? "dark" : "light";

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer
        manifest={manifest}
        inputs={{
          theme: themeType,
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
