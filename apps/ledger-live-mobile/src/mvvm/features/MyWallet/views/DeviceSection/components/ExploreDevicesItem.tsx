import React from "react";
import { Image } from "react-native";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import allDevicesImage from "@assets/images/devices/AllDevices.webp";

export function ExploreDevicesItem() {
  const { t } = useTranslation();

  return (
    <ListItem
      lx={{ backgroundColor: "surface", borderRadius: "md" }}
      testID="my-wallet-device-section-explore"
    >
      <ListItemLeading>
        <Image source={allDevicesImage} style={{ width: 40, height: 40 }} resizeMode="contain" />
        <ListItemContent>
          <ListItemTitle>{t("myWallet.deviceSection.exploreAllDevices")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <ChevronRight size={24} />
      </ListItemTrailing>
    </ListItem>
  );
}
