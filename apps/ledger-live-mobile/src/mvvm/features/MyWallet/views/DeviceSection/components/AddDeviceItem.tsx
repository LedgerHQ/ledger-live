import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type AddDeviceItemProps = {
  readonly onPress: () => void;
};

export function AddDeviceItem({ onPress }: AddDeviceItemProps) {
  const { t } = useTranslation();

  return (
    <ListItem
      lx={{ backgroundColor: "surface", borderRadius: "md", paddingVertical: "s4" }}
      testID="my-wallet-device-section-add-device"
      onPress={onPress}
    >
      <ListItemLeading>
        <Box
          lx={{
            backgroundColor: "muted",
            borderRadius: "full",
            width: "s48",
            height: "s48",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} color="base" />
        </Box>
        <ListItemContent>
          <ListItemTitle>{t("myWallet.deviceSection.addDevice")}</ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
