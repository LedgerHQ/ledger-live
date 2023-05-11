import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RouteComponentProps, useHistory, useLocation } from "react-router-dom";
import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import { languageSelector } from "~/renderer/reducers/settings";
import WebRecoverPlayer from "~/renderer/components/WebRecoverPlayer";
import useTheme from "~/renderer/hooks/useTheme";
import styled from "styled-components";

export type RecoverComponentParams = {
  appId: string;
};

const FullscreenWrapper = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 20;
`;

export default function RecoverPlayer({ match }: RouteComponentProps<RecoverComponentParams>) {
  const { params } = match;
  const { search } = useLocation();
  const queryParams = useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
  const locale = useSelector(languageSelector);
  const localManifest = useLocalLiveAppManifest(params.appId);
  const remoteManifest = useRemoteLiveAppManifest(params.appId);
  const manifest = localManifest || remoteManifest;
  const theme = useTheme("colors.palette.type");
  const history = useHistory();
  const onClose = useCallback(() => history.goBack(), [history]);

  return manifest ? (
    <FullscreenWrapper>
      <WebRecoverPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
          ...params,
          ...queryParams,
        }}
        onClose={onClose}
      />
    </FullscreenWrapper>
  ) : null; // TODO: display an error component instead of `null`
}
