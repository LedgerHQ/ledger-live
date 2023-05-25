import React, { useCallback } from "react";
import { Flex, Icon, Text, Link, Icons, Tag } from "@ledgerhq/native-ui";
import { Linking, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "react-i18next";
import { useManifest } from "@ledgerhq/live-common/platform/hooks/useManifest";
import { appendQueryParamsToDappURL } from "@ledgerhq/live-common/platform/utils/appendQueryParamsToDappURL";

import { ListProvider } from "./types";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../../const";
import Kiln from "../../../icons/Kiln";
import { useAnalytics } from "../../../analytics";

type Props = {
  provider: ListProvider;
};

export function EthereumStakingDrawerProvider({ provider }: Props) {
  const { t, i18n } = useTranslation();
  const manifest = useManifest(provider.liveAppId);
  const { track, page } = useAnalytics();
  const hasTag = i18n.exists(`stake.ethereum.providers.${provider.id}.tag`);
  const { navigate } =
    useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const onProviderPress = useCallback(() => {
    if (manifest) {
      const customDappURL =
        provider.queryParams &&
        appendQueryParamsToDappURL(manifest, provider.queryParams)?.toString();
      track("button_clicked", {
        button: provider.id,
        page,
      });
      navigate(ScreenName.PlatformApp, {
        platform: manifest.id,
        name: manifest.name,
        ...(customDappURL ? { customDappURL } : {}),
      });
    }
  }, [manifest, navigate, provider, track, page]);

  const onSupportLinkPress = useCallback(async () => {
    if (provider.supportLink) {
      const supported = await Linking.canOpenURL(provider.supportLink);
      if (supported) {
        track("button_clicked", {
          page,
        });
        await Linking.openURL(provider.supportLink);
      }
    }
  }, [provider, track, page]);

  return (
    <TouchableOpacity onPress={onProviderPress}>
      <Flex flexDirection="row" columnGap={16}>
        <Kiln size={32} />
        <Flex rowGap={12} alignItems="flex-start" flex={1}>
          <Flex rowGap={2}>
            <Flex
              flexDirection="row"
              columnGap={8}
              rowGap={8}
              mb={2}
              flexWrap="wrap"
            >
              <Text variant="body" fontWeight="semiBold">
                {t(`stake.ethereum.providers.${provider.id}.title`)}
              </Text>
              {hasTag && (
                <Tag type="color">
                  {t(`stake.ethereum.providers.${provider.id}.tag`)}
                </Tag>
              )}
            </Flex>
            <Text variant="paragraph" lineHeight="20px" color="neutral.c70">
              {t(`stake.ethereum.providers.${provider.id}.description`)}
            </Text>
          </Flex>
          <Link
            size="medium"
            type="color"
            iconPosition="right"
            onPress={onSupportLinkPress}
            Icon={Icons.ExternalLinkMedium}
          >
            {t(`stake.ethereum.providers.${provider.id}.supportLink`)}
          </Link>
        </Flex>
        <Flex alignSelf="center">
          <Icon name="ChevronRight" size={32} color="neutral.c100" />
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
