import React from "react";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
import { useDeepLinkListener } from "~/renderer/screens/earn/useDeepLinkListener";
import { useLiveAppParameters } from "~/renderer/hooks/useLiveAppParameters";
import { useLiveAppManifest } from "~/renderer/hooks/useLiveAppManifest";
import { useLiveAppTopBarConfig } from "~/renderer/hooks/useLiveAppTopBarConfig";
import { Container } from "./styles";

const DEFAULT_SWAP_APP_ID = "swap";

const Swap = () => {
  const manifest = useLiveAppManifest(DEFAULT_SWAP_APP_ID);
  const topBarConfig = useLiveAppTopBarConfig();
  const liveAppParameters = useLiveAppParameters();

  useDeepLinkListener();

  return (
    <Container data-test-id="swap-app-container">
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig,
            topBarDisabled: true,
          }}
          manifest={manifest}
          inputs={liveAppParameters}
        />
      ) : null}
    </Container>
  );
};

export default Swap;
