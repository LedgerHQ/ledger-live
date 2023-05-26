import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";
import { Account } from "@ledgerhq/types-live";

import { ListProvider } from "./types";
import { EthereumStakingDrawerProvider } from "./EthereumStakingDrawerProvider";
import { useAnalytics } from "../../../analytics";
import { ScreenName } from "../../../const";

type Props = {
  providers: ListProvider[];
  singleProviderRedirectMode: boolean;
  account: Account;
};

export function EthereumStakingDrawerBody({
  providers,
  singleProviderRedirectMode,
  account,
}: Props) {
  const { t } = useTranslation();
  const { navigate } = useNavigation();

  const { track, page } = useAnalytics();

  const onProviderPress = useCallback(
    ({
      manifest,
      provider,
    }: {
      manifest: LiveAppManifest;
      provider: ListProvider;
    }) => {
      if (manifest) {
        const customDappURL =
          provider.queryParams &&
          appendQueryParamsToDappURL(
            manifest,
            provider.queryParams,
          )?.toString();
        track("button_clicked", {
          button: provider.id,
          page,
        });
        navigate(ScreenName.PlatformApp, {
          platform: manifest.id,
          name: manifest.name,
          account: account.id,
          ...(customDappURL ? { customDappURL } : {}),
        });
      }
    },
    [track, page, navigate, account],
  );

  const onSupportLinkPress = useCallback(
    async ({ provider }: { provider: ListProvider }) => {
      if (provider.supportLink) {
        const supported = await Linking.canOpenURL(provider.supportLink);
        if (supported) {
          track("button_clicked", {
            page,
          });
          await Linking.openURL(provider.supportLink);
        }
      }
    },
    [track, page],
  );

  const redirectIfOneProvider = useCallback(
    ({
      manifest,
      provider,
    }: {
      manifest: LiveAppManifest;
      provider: ListProvider;
    }) => {
      if (singleProviderRedirectMode && providers.length === 1) {
        onProviderPress({ manifest, provider });
      }
    },
    [],
  );

  return (
    <Flex rowGap={56}>
      <Flex rowGap={16}>
        <Text variant="h4">{t("stake.ethereum.title")}</Text>
        <Text variant="body" lineHeight="21px" color="neutral.c70">
          {t("stake.ethereum.subTitle")}
        </Text>
      </Flex>
      <ScrollView>
        <Flex rowGap={52}>
          {providers.map(provider => (
            <EthereumStakingDrawerProvider
              key={provider.id}
              provider={provider}
              onProviderPress={onProviderPress}
              onSupportLinkPress={onSupportLinkPress}
              redirectIfOneProvider={redirectIfOneProvider}
            />
          ))}
        </Flex>
      </ScrollView>
    </Flex>
  );
}
