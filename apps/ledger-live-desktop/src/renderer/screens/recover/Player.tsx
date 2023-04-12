import React from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { languageSelector } from "~/renderer/reducers/settings";
import WebRecoverPlayer from "~/renderer/components/WebRecoverPlayer";
import useTheme from "~/renderer/hooks/useTheme";

export type RecoverComponentParams = {
  appId: string;
};

export default function RecoverPlayer({ match }: RouteComponentProps<RecoverComponentParams>) {
  const { params } = match;
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(params.appId);
  const remoteManifest = useRemoteLiveAppManifest(params.appId);
  const manifest = localManifest || remoteManifest;
  const theme = useTheme("colors.palette.type");

  return manifest ? (
    <WebRecoverPlayer
      manifest={manifest}
      inputs={{
        theme,
        lang: locale,
        ...params,
      }}
    />
  ) : null; // TODO: display an error component instead of `null`
}
