import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, Text } from "@ledgerhq/native-ui";

import { EvmStakingDrawerProviderIcon } from "./EvmStakingDrawerProviderIcon";
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
};

export function EvmStakingDrawerProvider({
  provider,
  onProviderPress,
  redirectIfOneProvider,
}: Props) {
  const localManifest = useLocalLiveAppManifest(provider.liveAppId);
  const remoteManifest = useRemoteLiveAppManifest(provider.liveAppId);
  const manifest = remoteManifest || localManifest;

  const { t } = useTranslation();

  const providerPress = useCallback(() => {
    if (manifest) {
      onProviderPress({ manifest, provider });
    }
  }, [manifest, provider, onProviderPress]);

  useEffect(() => {
    if (manifest) {
      redirectIfOneProvider({ manifest, provider });
    }
  }, [manifest, provider, redirectIfOneProvider]);

  return (
    <TouchableOpacity onPress={providerPress}>
      <Flex
        flexDirection="row"
        columnGap={16}
        alignItems="center"
        borderRadius={2}
        p={5}
        backgroundColor="opacityDefault.c05"
      >
        <EvmStakingDrawerProviderIcon icon={provider.icon} />
        <Flex rowGap={2} alignItems="flex-start" flex={3}>
          <Flex flexDirection="column" flex={1} alignItems="flex-start">
            <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
              {t(`stake.ethereum.provider.${provider.id}.title`)}
            </Text>
            <Text variant="paragraph" fontSize={13} color="neutral.c70">
              {provider.lst
                ? t("stake.ethereum.lst")
                : provider.min
                  ? t("stake.ethereum.required_minimum", {
                      min: provider.min,
                    })
                  : t("stake.ethereum.no_minimum")}
            </Text>
          </Flex>
        </Flex>
        <Flex flex={2}>
          {provider.rewardsStrategy ? (
            <Text
              variant="paragraph"
              fontSize={12}
              color="neutral.c70"
              flexWrap="wrap"
              textAlign="right"
            >
              {t(`stake.ethereum.rewards_strategy.${provider.rewardsStrategy}`)}
            </Text>
          ) : (
            <></>
          )}
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
