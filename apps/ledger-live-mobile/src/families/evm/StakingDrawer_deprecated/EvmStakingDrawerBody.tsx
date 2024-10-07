import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { ParamListBase, useNavigation } from "@react-navigation/native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";

import { ListProvider } from "./types";
import { EvmStakingDrawerProvider } from "./EvmStakingDrawerProvider";
import { useAnalytics } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { StackNavigationProp } from "@react-navigation/stack";

type Props = {
  providers: ListProvider[];
  singleProviderRedirectMode: boolean;
  accountId: string;
  onClose(callback: () => void): void;
};

export function EvmStakingDrawerBody({
  providers,
  singleProviderRedirectMode,
  accountId,
  onClose,
}: Props) {
  const { t } = useTranslation();
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

  const redirectIfOneProvider = useCallback(
    ({ manifest, provider }: { manifest: LiveAppManifest; provider: ListProvider }) => {
      if (singleProviderRedirectMode && providers.length === 1) {
        onProviderPress({ manifest, provider });
      }
    },
    [onProviderPress, singleProviderRedirectMode, providers.length],
  );

  return (
    <Flex rowGap={16}>
      <Flex rowGap={24} pb={8}>
        <Text variant="h4">{t("stake.ethereum_deprecated.title")}</Text>
        <Text variant="body" lineHeight="21px" color="neutral.c70">
          {t("stake.ethereum_deprecated.subTitle")}
        </Text>
      </Flex>
      <Flex rowGap={32} pb={32}>
        {providers.map(provider => (
          <EvmStakingDrawerProvider
            key={provider.id}
            provider={provider}
            onProviderPress={onProviderPress}
            redirectIfOneProvider={redirectIfOneProvider}
          />
        ))}
      </Flex>
    </Flex>
  );
}
