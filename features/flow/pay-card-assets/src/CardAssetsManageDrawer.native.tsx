import React from "react";
import { Pressable } from "react-native";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spinner,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { MenuBurger } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { useListReorder } from "@shared/ui-list-reorder/native";
import type { CardAssetRow } from "./types";

type CardAssetsManageDrawerProps = Readonly<{
  rows: readonly CardAssetRow[];
  onAddAsset?: () => void;
  onMoveAsset: (id: string, toIndex: number) => Promise<void>;
  reorderingAssetId: string | null;
}>;

export function CardAssetsManageDrawer({
  rows,
  onAddAsset,
  onMoveAsset,
  reorderingAssetId,
}: CardAssetsManageDrawerProps) {
  const { t } = useTranslation();
  const reorder = useListReorder({
    onMove: (id, toIndex) => void onMoveAsset(id, toIndex),
    disabled: reorderingAssetId !== null,
  });

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
        {rows.map(row => {
          const handleProps = reorder.getHandleProps(row.id);
          return (
            <Box key={row.id} {...reorder.getRowProps(row.id)}>
              <ListItem lx={{ backgroundColor: "surface" }}>
                <ListItemLeading>
                  <ListItemContent>
                    <ListItemTitle>{row.name}</ListItemTitle>
                  </ListItemContent>
                </ListItemLeading>
                <ListItemTrailing>
                  {reorderingAssetId === row.id ? (
                    <Spinner size={24} testID={`card-asset-reorder-spinner-${row.id}`} />
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("payTab.card.assets.manageDialog.reorder", {
                        asset: row.name,
                      })}
                      accessibilityActions={[...handleProps.accessibilityActions]}
                      accessibilityState={handleProps.accessibilityState}
                      onAccessibilityAction={handleProps.onAccessibilityAction}
                      onLongPress={handleProps.onLongPress}
                      onPressOut={handleProps.onPressOut}
                      onTouchMove={handleProps.onTouchMove}
                      disabled={reorderingAssetId !== null}
                      testID={`card-asset-reorder-handle-${row.id}`}
                    >
                      <MenuBurger size={24} />
                    </Pressable>
                  )}
                </ListItemTrailing>
              </ListItem>
            </Box>
          );
        })}
      </Box>
      <Text accessibilityLiveRegion="polite" lx={{ position: "absolute", opacity: 0 }}>
        {reorder.announcement}
      </Text>
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
