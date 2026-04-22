import React from "react";
import { Image } from "react-native";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import allDevicesImage from "@assets/images/devices/AllDevices.webp";

type ExploreDevicesItemProps = {
  readonly onPress: () => void;
};

export function ExploreDevicesItem({ onPress }: ExploreDevicesItemProps) {
  const { t } = useTranslation();

  return (
    <ListItem
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      testID="my-wallet-device-section-explore"
      onPress={onPress}
    >
      <ListItemLeading>
        <Image source={allDevicesImage} style={{ width: 40, height: 40 }} resizeMode="contain" />
        <ListItemContent>
          <ListItemTitle>{t("myWallet.deviceSection.exploreAllDevices")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ExternalLink size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
