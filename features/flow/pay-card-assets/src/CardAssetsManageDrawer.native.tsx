import React from "react";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import type { CardAssetsManageContentProps } from "./types";

type CardAssetsManageDrawerProps = Pick<CardAssetsManageContentProps, "rows" | "onAddAsset">;

export function CardAssetsManageDrawer({ rows, onAddAsset }: CardAssetsManageDrawerProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
      <Box lx={{ gap: "s8" }}>
        <Text typography="heading3SemiBold" lx={{ color: "base" }}>
          {t("payTab.card.assets.manageDialog.title")}
        </Text>
        <Text typography="body2" lx={{ color: "muted" }}>
          {t("payTab.card.assets.manageDialog.description")}
        </Text>
      </Box>
      <Box
        lx={{
          backgroundColor: "surface",
          borderRadius: "md",
          paddingHorizontal: "s12",
        }}
      >
        {rows.map(row => (
          <ListItem key={row.id} lx={{ backgroundColor: "surface" }}>
            <ListItemLeading>
              <ListItemContent>
                <ListItemTitle>{row.name}</ListItemTitle>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}
      </Box>
      {onAddAsset ? (
        <Box lx={{ alignItems: "center", gap: "s12", paddingTop: "s16" }}>
          <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
            {t("payTab.card.assets.manageDialog.addAssetCaption")}
          </Text>
          <Button appearance="base" size="lg" isFull onPress={onAddAsset} testID="card-assets-add">
            {t("payTab.card.assets.manageDialog.addAsset")}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
