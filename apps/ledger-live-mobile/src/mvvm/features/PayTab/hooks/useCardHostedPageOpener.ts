import { useCallback } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useLiveAppManifest } from "@ledgerhq/live-common/wallet-api/useLiveAppManifest";
import { buildHostedUrl, type OpenCardHostedPage } from "@features/flow-pay-card-auth";
import useEnv from "@features/platform-env";
import { NavigatorName, ScreenName } from "~/const";

export function useCardHostedPageOpener(): OpenCardHostedPage {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const hostedManifestId = useEnv("CARD_BAANX_HOSTED_MANIFEST_ID");
  const manifest = useLiveAppManifest(hostedManifestId);

  return useCallback(
    async path => {
      if (!manifest) {
        throw new Error("useCardHostedPageOpener: the catalog holds no Card manifest");
      }

      // `getInitialURL` opens `goToURL` as long as it sits on the manifest's own domain, so the
      // page loads inside the Discover webview instead of the secure browser.
      navigation.navigate(NavigatorName.Base, {
        screen: ScreenName.PlatformApp,
        params: {
          platform: manifest.id,
          goToURL: buildHostedUrl(String(manifest.url), path),
        },
      });
    },
    [navigation, manifest],
  );
}
