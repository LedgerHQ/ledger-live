import React, { useCallback } from "react";
import { Flex, Icon, Text, Link, Icons, Tag } from "@ledgerhq/native-ui";
import { useManifests } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { TouchableOpacity } from "react-native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "react-i18next";

import { ListProvider } from "./types";
import { ScreenName } from "../../../const/navigation";
import { StackNavigatorNavigation } from "../../../components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../../components/RootNavigator/types/BaseNavigator";

type Props = {
  provider: ListProvider;
};

export function EthereumStakingDrawerProvider({ provider }: Props) {
  const { t, i18n } = useTranslation();
  const [manifest]: LiveAppManifest[] = useManifests({
    id: provider.liveAppId,
  });
  const hasTag = i18n.exists(`stake.ethereum.providers.${provider.id}.tag`);
  const navigation =
    useNavigation<StackNavigatorNavigation<BaseNavigatorStackParamList>>();
  const onProviderPress = useCallback(() => {
    // GO-TO the provider live app.
    navigation.navigate(ScreenName.PlatformApp, {
      platform: manifest.id,
      name: manifest.name,
    });
  }, [manifest.id, manifest.name, navigation]);

  const onSupportLinkPress = useCallback(() => {
    // GO-TO the provider live app.
    console.log({ provider });
  }, [provider]);

  return (
    <TouchableOpacity onPress={onProviderPress}>
      <Flex flexDirection="row" columnGap={16}>
        <Icon name="Group" size={32} />
        <Flex rowGap={12} alignItems="flex-start">
          <Flex rowGap={2}>
            <Flex flexDirection="row" columnGap={8}>
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
        <Icon name="ChevronRight" size={32} />
      </Flex>
    </TouchableOpacity>
  );
}
