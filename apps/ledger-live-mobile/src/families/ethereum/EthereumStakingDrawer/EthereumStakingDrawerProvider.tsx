import React, { useCallback, useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import { Flex, Icon, Text, Link, Icons, Tag } from "@ledgerhq/native-ui";
import { useManifest } from "@ledgerhq/live-common/platform/hooks/useManifest";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

import { EthereumStakingDrawerProviderIcon } from "./EthereumStakingDrawerProviderIcon";
import { ListProvider } from "./types";

type Props = {
  provider: ListProvider;
  redirectIfOneProvider({
    manifest,
    provider,
  }: {
    manifest: LiveAppManifest;
    provider: ListProvider;
  }): void;
  onProviderPress({
    manifest,
    provider,
  }: {
    manifest: LiveAppManifest;
    provider: ListProvider;
  }): void;
  onSupportLinkPress({ provider }: { provider: ListProvider }): Promise<void>;
};

export function EthereumStakingDrawerProvider({
  provider,
  onProviderPress,
  redirectIfOneProvider,
  onSupportLinkPress,
}: Props) {
  const { t, i18n } = useTranslation();
  const manifest = useManifest(provider.liveAppId);
  const hasTag = i18n.exists(`stake.ethereum.providers.${provider.id}.tag`);

  const providerPress = useCallback(() => {
    if (manifest) {
      onProviderPress({ manifest, provider });
    }
  }, [manifest, provider, onProviderPress]);

  const supportLinkPress = useCallback(() => {
    onSupportLinkPress({ provider });
  }, [provider, onSupportLinkPress]);

  useEffect(() => {
    if (manifest) {
      redirectIfOneProvider({ manifest, provider });
    }
  }, [manifest, provider, redirectIfOneProvider]);

  return (
    <TouchableOpacity onPress={providerPress}>
      <Flex flexDirection="row" columnGap={16}>
        <EthereumStakingDrawerProviderIcon icon={provider.icon} />
        <Flex rowGap={2} alignItems="flex-start" flex={1}>
          <Flex flexDirection="row" columnGap={8} rowGap={8} mb={2}>
            <Text variant="body" fontWeight="semiBold">
              {t(`stake.ethereum.providers.${provider.id}.title`)}
            </Text>
            {hasTag && <Tag type="color">{t(`stake.ethereum.providers.${provider.id}.tag`)}</Tag>}
          </Flex>
          <Flex rowGap={12}>
            <Text variant="paragraph" lineHeight="20px" color="neutral.c70">
              {t(`stake.ethereum.providers.${provider.id}.description`)}
            </Text>
            <Link
              size="medium"
              type="color"
              iconPosition="right"
              onPress={supportLinkPress}
              Icon={Icons.ExternalLinkMedium}
            >
              {t(`stake.ethereum.providers.${provider.id}.supportLink`)}
            </Link>
          </Flex>
        </Flex>
        <Flex alignSelf="center">
          <Icon name="ChevronRight" size={32} color="neutral.c100" />
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
