import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import { AppIcon } from "../AppIcon";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { ScreenName } from "~/const";
import { useNavigation } from "@react-navigation/core";
import { NavigationProps } from "../types";

export function LocalLiveApp({ localLiveApps }: { localLiveApps: LiveAppManifest[] }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProps["navigation"]>();

  return (
    <>
      <Flex flexDirection="row" alignItems="center" paddingX={4}>
        <Flex flex={1} justifyContent="center">
          <Text variant={"h4"} fontWeight={"semiBold"}>
            {t("browseWeb3.catalog.section.locallyLoaded")}
          </Text>
        </Flex>
      </Flex>

      <ScrollContainer paddingLeft={6} horizontal showsHorizontalScrollIndicator={false}>
        {localLiveApps.map(manifest => (
          <TouchableOpacity
            key={`${manifest.id}.${manifest.branch}`}
            style={{
              width: 70,
              marginBottom: 16,
              marginRight: 16,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              navigation.navigate(ScreenName.PlatformApp, {
                platform: manifest.id,
                name: manifest.name,
              });
            }}
          >
            <Flex marginBottom={4}>
              <AppIcon size={52} name={manifest.name} icon={manifest.icon} />
            </Flex>
            <Text numberOfLines={1}>{manifest.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollContainer>
    </>
  );
}
