import { useRemoteLiveAppManifest } from "@ledgerhq/live-common/platform/providers/RemoteLiveAppProvider/index";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { useLocalLiveAppManifest } from "@ledgerhq/live-common/wallet-api/LocalLiveAppProvider/index";
import { Flex, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { useTheme } from "styled-components/native";
import { EvmStakingDrawerProviderIcon } from "./EvmStakingDrawerProviderIcon";
import { ListProvider } from "./types";

interface Props {
  provider: ListProvider;
  onProviderPress({
    manifest,
    provider,
  }: {
    manifest: LiveAppManifest;
    provider: ListProvider;
  }): void;
}

export function EvmStakingDrawerProvider({ provider, onProviderPress }: Props) {
  const localManifest = useLocalLiveAppManifest(provider.liveAppId);
  const remoteManifest = useRemoteLiveAppManifest(provider.liveAppId);
  const manifest = remoteManifest || localManifest;

  const theme = useTheme();

  const { t } = useTranslation();

  const providerPress = useCallback(() => {
    if (manifest) {
      onProviderPress({ manifest, provider });
    }
  }, [manifest, provider, onProviderPress]);

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
        <EvmStakingDrawerProviderIcon
          icon={provider.icon}
          outline={theme.theme === "light" ? theme.colors.neutral.c50 : undefined}
        />
        <Flex rowGap={2} alignItems="flex-start" flex={3}>
          <Flex flexDirection="column" flex={1} alignItems="flex-start">
            <Text variant="bodyLineHeight" fontSize={14} fontWeight="semiBold" mr={2}>
              {t(`stake.ethereum.provider.${provider.id}.title`)}
            </Text>
            <Text variant="paragraph" fontSize={13} color="neutral.c70">
              {provider.lst
                ? t("stake.ethereum.lst")
                : provider.min
                  ? t("stake.ethereum.requiredMinimum", {
                      min: provider.min,
                    })
                  : t("stake.ethereum.noMinimum")}
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
              {t(`stake.ethereum.rewardsStrategy.${provider.rewardsStrategy}`)}
            </Text>
          ) : (
            <></>
          )}
        </Flex>
      </Flex>
    </TouchableOpacity>
  );
}
