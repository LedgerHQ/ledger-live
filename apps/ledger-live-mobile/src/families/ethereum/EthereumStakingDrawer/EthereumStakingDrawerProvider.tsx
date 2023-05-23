import React, { useCallback } from "react";
import { Flex, Icon, Text, Link, Icons, Tag } from "@ledgerhq/native-ui";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Linking, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "react-i18next";

import { ListProvider } from "./types";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";
import { generateValidDappURLWithParams } from "../../../helpers/generateValidDappURLWithParams";
import { ScreenName } from "../../../const";

type Props = {
  provider: ListProvider;
};

export function EthereumStakingDrawerProvider({ provider }: Props) {
  const { t, i18n } = useTranslation();
  const [manifest]: LiveAppManifest[] = useManifests({
    id: provider.liveAppId,
  });
  const hasTag = i18n.exists(`stake.ethereum.providers.${provider.id}.tag`);
  const { navigate } =
    useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();

  const onProviderPress = useCallback(() => {
    if (manifest) {
      const customDappURL =
        provider.queryParams &&
        generateValidDappURLWithParams(
          manifest.p ?? "",
          provider.queryParams,
        )?.toString();
      navigate(ScreenName.PlatformApp, {
        platform: manifest.id,
        name: manifest.name,
        ...(customDappURL ? { customDappURL } : {}),
      });
    }
  }, [manifest, navigate, provider.queryParams]);

  const onSupportLinkPress = useCallback(async () => {
    if (provider.supportLink) {
      const supported = await Linking.canOpenURL(provider.supportLink);
      if (supported) {
        await Linking.openURL(provider.supportLink);
      }
    }
  }, [provider.supportLink]);

  return (
    <TouchableOpacity onPress={onProviderPress}>
      <Flex flexDirection="row" columnGap={16}>
        <Icon name="Group" size={32} />
        <Flex rowGap={12} alignItems="flex-start" flex={1}>
          <Flex rowGap={2}>
            <Flex flexDirection="row" columnGap={8} rowGap={8} flexWrap="wrap">
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
