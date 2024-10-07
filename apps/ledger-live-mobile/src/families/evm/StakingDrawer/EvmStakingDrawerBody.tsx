import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { Flex } from "@ledgerhq/native-ui";
import { ParamListBase, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { useCallback } from "react";
import { useAnalytics } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { EvmStakingDrawerProvider } from "./EvmStakingDrawerProvider";
import { ListProvider } from "./types";

interface Props {
  providers: ListProvider[];
  accountId: string;
  onClose(callback: () => void): void;
}

export function EvmStakingDrawerBody({ providers, accountId, onClose }: Props) {
  const navigation = useNavigation<StackNavigationProp<ParamListBase, string, NavigatorName>>();

  const { track, page } = useAnalytics();

  const onProviderPress = useCallback(
    ({ manifest, provider }: { manifest: LiveAppManifest; provider: ListProvider }) => {
      if (manifest) {
        const customDappURL =
          provider.queryParams &&
          appendQueryParamsToDappURL(manifest, provider.queryParams)?.toString();
        track("button_clicked", {
          button: provider.id,
          page,
        });
        onClose(() => {
          navigation.navigate(ScreenName.PlatformApp, {
            platform: manifest.id,
            name: manifest.name,
            accountId,
            ...(customDappURL ? { customDappURL } : {}),
          });
        });
      }
    },
    [track, page, navigation, accountId, onClose],
  );

  return (
    <Flex rowGap={16} pb={32}>
      {providers.map(x => (
        <EvmStakingDrawerProvider key={x.id} provider={x} onProviderPress={onProviderPress} />
      ))}
    </Flex>
  );
}
