import React from "react";
import { usePlatformApp } from "@ledgerhq/live-common/lib/platform/PlatformAppProvider";

import { useTheme } from "@react-navigation/native";
import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";

const PlatformApp = ({ route }: { route: { params: Props } }) => {
  const { dark } = useTheme();
  const appId = route.params.platform;
  const { manifests } = usePlatformApp();
  const manifest = manifests.get(appId);
  const themeType = dark ? "dark" : "light";

  return (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer
        manifest={manifest}
        inputs={{
          theme: themeType,
        }}
      />
    </>
  );
};

export default PlatformApp;
