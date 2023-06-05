import React from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/platform/providers/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "../../../analytics/TrackScreen";
import WebPlatformPlayer from "../../../components/WebPlatformPlayer";
import GenericErrorView from "../../../components/GenericErrorView";
import { useLocale } from "../../../context/Locale";
import { Props } from "../LiveApp";

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

export function LiveApp({ route }: Props) {
  const { theme } = useTheme();
  const { platform: appId, ...params } = route.params || {};
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  let manifest = localManifest || remoteManifest;

  if (
    route.params.customDappURL &&
    manifest &&
    manifest.params &&
    "dappUrl" in manifest.params
  ) {
    manifest = {
      ...manifest,
      params: {
        ...manifest.params,
        dappUrl: route.params.customDappURL,
      },
    };
  }

  return manifest ? (
    <>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
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
}
