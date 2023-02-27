import React from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import { AppIcon } from "../AppIcon";

export function RecentlyUsed({
  recentlyUsed,
  onSelect,
}: {
  recentlyUsed: LiveAppManifest[];
  onSelect: (manifest: LiveAppManifest) => void;
}) {
  const { t } = useTranslation();

  return recentlyUsed.length > 0 ? (
    <>
      <Text
        variant={"h4"}
        fontWeight={"semiBold"}
        marginBottom={16}
        marginLeft={16}
      >
        {t("browseWeb3.catalog.section.recentlyUsed")}
      </Text>

      <ScrollContainer
        paddingLeft={6}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {recentlyUsed.map(manifest => (
          <TouchableOpacity
            key={`${manifest.id}.${manifest.branch}`}
            style={{
              width: 70,
              marginBottom: 16,
              marginRight: 16,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => onSelect(manifest)}
          >
            <Flex marginBottom={4}>
              <AppIcon size={52} name={manifest.name} icon={manifest.icon} />
            </Flex>
            <Text numberOfLines={1}>{manifest.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollContainer>
    </>
  ) : null;
}
