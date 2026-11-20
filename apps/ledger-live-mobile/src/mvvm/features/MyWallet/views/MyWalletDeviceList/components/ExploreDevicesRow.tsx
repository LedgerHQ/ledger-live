import React from "react";
import { Image } from "react-native";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { ExternalLink } from "@ledgerhq/lumen-ui-rnative/symbols";
import allDevicesImage from "@assets/images/devices/AllDevices.webp";
import { useTranslation } from "~/context/Locale";

const IMAGE_SIZE = 48;

export function ExploreDevicesRow({ onPress }: Readonly<{ onPress: () => void }>) {
  const { t } = useTranslation();

  return (
    <Box lx={{ backgroundColor: "surface", borderRadius: "md", padding: "s4" }}>
      <ListItem density="expanded" onPress={onPress} testID="my-wallet-explore-devices">
        <ListItemLeading>
          <Image
            source={allDevicesImage}
            style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
            resizeMode="contain"
          />
          <ListItemContent>
            <ListItemTitle>{t("myWallet.deviceSection.exploreAllDevices")}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
        <ListItemTrailing>
          <ExternalLink size={24} color="muted" />
        </ListItemTrailing>
      </ListItem>
    </Box>
  );
}
