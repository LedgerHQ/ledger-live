import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/wallet-api/utils/appendQueryParamsToDappURL";
import { deriveAccountIdForManifest } from "@ledgerhq/live-common/wallet-api/utils/deriveAccountIdForManifest";
import { Flex } from "@ledgerhq/native-ui";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback } from "react";
import { useAnalytics } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { EvmStakingDrawerProvider } from "./EvmStakingDrawerProvider";
import { ListProvider } from "./types";

interface Props {
  providers: ListProvider[];
  accountId: string;
  walletApiAccountId: string;
  onClose(callback: () => void): void;
}

export function EvmStakingDrawerBody({
  providers,
  accountId,
  walletApiAccountId,
  onClose,
}: Readonly<Props>) {
  const navigation =
    useNavigation<NativeStackNavigationProp<ParamListBase, string, NavigatorName>>();

  const { track, page } = useAnalytics();

  const onProviderPress = useCallback(
    ({ manifest, provider }: { manifest: LiveAppManifest; provider: ListProvider }) => {
      if (manifest) {
        const accountIdForManifestVersion = deriveAccountIdForManifest(
          accountId,
          walletApiAccountId,
          manifest,
        );

        /** If the manifest is for a live app, send the wallet api account id instead of LL account id. */
        const customDappURL = appendQueryParamsToDappURL(manifest, {
          ...(provider?.queryParams ?? {}),
          accountId: accountIdForManifestVersion,
        })?.toString();

        track("button_clicked", {
          button: provider.id,
          page,
        });
        onClose(() => {
          navigation.navigate(NavigatorName.Base, {
            screen: ScreenName.PlatformApp,
            params: {
              platform: manifest.id,
              name: manifest.name,
              accountId: accountIdForManifestVersion,
              walletAccountId: walletApiAccountId,
              ledgerAccountId: accountId,
              ...(customDappURL ? { customDappURL } : {}),
            },
          });
        });
      }
    },
    [walletApiAccountId, track, page, onClose, navigation, accountId],
  );

  return (
    <Flex rowGap={16} pb={32}>
      {providers.map(x => (
        <EvmStakingDrawerProvider key={x.id} provider={x} onProviderPress={onProviderPress} />
      ))}
    </Flex>
  );
}
