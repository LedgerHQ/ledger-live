import React, { useEffect } from "react";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import {
  useRemoteLiveAppContext,
  useRemoteLiveAppManifest,
} from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { Flex, InfiniteLoader } from "@ledgerhq/native-ui";
import TrackScreen from "~/analytics/TrackScreen";
import WebPlatformPlayer from "~/components/WebPlatformPlayer";
import GenericErrorView from "~/components/GenericErrorView";
import { useLocale } from "~/context/Locale";
import { ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PlatformApp>;

export function LiveApp({ route }: Props) {
  const { theme } = useTheme();
  // For consistency with LLD, customDappUrl casing should be allowed for Swap
  const { platform: appId, customDappURL, customDappUrl, ...params } = route.params || {};
  const { setParams } = useNavigation<Props["navigation"]>();
  const localManifest = useLocalLiveAppManifest(appId);
  const remoteManifest = useRemoteLiveAppManifest(appId);
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();
  let manifest = localManifest || remoteManifest;

  useEffect(() => {
    setParams({
      ...(manifest?.name ? { name: manifest.name } : {}),
    });
  }, [manifest, setParams]);

  const dappUrl = customDappURL || customDappUrl;

  if (dappUrl && manifest && manifest.params && "dappUrl" in manifest.params) {
    manifest = {
      ...manifest,
      params: {
        ...manifest.params,
        dappUrl,
      },
    };
  }
  if (dappUrl && manifest && manifest.dapp) {
    manifest = {
      ...manifest,
      url: dappUrl,
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
