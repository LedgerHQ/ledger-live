import React, { useEffect } from "react";
import { useRemoteLiveAppContext } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
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
import SafeAreaViewFixed from "~/components/SafeAreaView";

const appManifestNotFoundError = new Error("App not found"); // FIXME move this elsewhere.

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PlatformApp>;

export function LiveApp({ route }: Props) {
  const { theme } = useTheme();
  // For consistency with LLD, customDappUrl casing should be allowed for Swap
  const { platform: appId, customDappURL, customDappUrl, ...params } = route.params || {};
  const { setParams } = useNavigation<Props["navigation"]>();
  const { state: remoteLiveAppState } = useRemoteLiveAppContext();
  const { locale } = useLocale();

  const dappUrl = customDappURL || customDappUrl;
  const manifest = useLiveAppManifest(appId, dappUrl);

  useEffect(() => {
    setParams({
      ...(manifest?.name ? { name: manifest.name } : {}),
    });
  }, [manifest, setParams]);

  return manifest ? (
    <SafeAreaViewFixed edges={["bottom", "left", "right"]} isFlex>
      <TrackScreen category="Platform" name="App" />
      <WebPlatformPlayer
        manifest={manifest}
        inputs={{
          theme,
          lang: locale,
          ...params,
        }}
      />
    </SafeAreaViewFixed>
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
