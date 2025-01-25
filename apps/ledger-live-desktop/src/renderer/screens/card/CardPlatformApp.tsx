// TODO: Delete this file after completing the Card Program Dapp rollout.
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import React from "react";
import { useLocation } from "react-router-dom";
import useTheme from "~/renderer/hooks/useTheme";
import { Card } from "~/renderer/components/Box";
import WebPlatformPlayer from "~/renderer/components/WebPlatformPlayer";
export const BAANX_APP_ID = "cl-card";

export default function CardPlatformApp() {
  const { state: urlParams } = useLocation();
  const manifest = useRemoteLiveAppManifest(BAANX_APP_ID);
  const themeType = useTheme().colors.palette.type;

  return (
    <Card
      grow
      style={{
        overflow: "hidden",
      }}
    >
      {manifest ? (
        <WebPlatformPlayer
          config={{
            topBarConfig: {
              shouldDisplayName: false,
              shouldDisplayInfo: false,
              shouldDisplayClose: false,
              shouldDisplayNavigation: true,
            },
          }}
          manifest={manifest}
          inputs={{
            theme: themeType,
            ...(urlParams as Record<string, string>),
          }}
        />
      ) : null}
    </Card>
  );
}
