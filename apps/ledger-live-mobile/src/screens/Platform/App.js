// @flow

import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/lib/platform/providers/LocalLiveAppProvider";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/lib/platform/providers/RemoteLiveAppProvider";
import type { StackScreenProps } from "@react-navigation/stack";
import { useNavigation, useTheme } from "@react-navigation/native";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";

const PlatformApp = ({ route }: StackScreenProps) => {
  const { dark } = useTheme();
  const { platform: appId, ...params } = route.params;
  const { setParams } = useNavigation();
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
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
  ) : null;
};

export default PlatformApp;
