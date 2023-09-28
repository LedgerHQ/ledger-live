import React from "react";
import Card from "~/renderer/components/Box/Card";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import { useLiveAppParameters } from "~/renderer/hooks/useLiveAppParameters";
import { useLiveAppManifest } from "~/renderer/hooks/useLiveAppManifest";
import { useLiveAppTopBarConfig } from "~/renderer/hooks/useLiveAppTopBarConfig";

const DEFAULT_SWAP_APP_ID = "swap";

const Swap = () => {
  const manifest = useLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const topBarConfig = useLiveAppTopBarConfig();
  const liveAppParameters = useLiveAppParameters();

  useDeepLinkListener();

  return (
    <Card grow style={{ overflow: "hidden" }} data-test-id="swap-app-container">
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig,
          }}
          manifest={manifest}
          inputs={liveAppParameters}
        />
      ) : null}
    </Card>
  );
};

export default Swap;
