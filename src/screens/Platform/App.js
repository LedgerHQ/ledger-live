// @flow

import React from "react";
import { usePlatformApp } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider";
import type { StackScreenProps } from "@react-navigation/stack";
import { useTheme } from "@react-navigation/native";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";

const PlatformApp = ({ route }: StackScreenProps) => {
  const { dark } = useTheme();
  const { platform: appId, ...params } = route.params;
  const { manifests } = usePlatformApp();
  const manifest = manifests.get(appId);
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
