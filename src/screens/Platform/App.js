import React from "react";
import { useAppManifest } from "@ledgerhq/live-common/lib/platform/CatalogProvider";

import TrackScreen from "../../analytics/TrackScreen";
import WebPlatformPlayer from "../../components/WebPlatformPlayer";

const PlatformApp = ({ route }: { route: { params: Props } }) => {
  const platform = route.params.platform;
  const manifest = useAppManifest(platform);

  return (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer manifest={manifest} />
    </>
  );
};

export default PlatformApp;
