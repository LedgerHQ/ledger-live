import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";

type CardAssetsManageFooterProps = Readonly<{
  onAddAsset?: () => void;
}>;

// Rendered through the bottom sheet's own `footer` slot (see CardDetailsSheet.native.tsx) rather
// than as regular scrollable content, so it gets the sheet's sticky-footer chrome: background,
// bottom safe-area inset and keyboard avoidance, and stays pinned below the reorder list.
export function CardAssetsManageFooter({ onAddAsset }: CardAssetsManageFooterProps) {
  const { t } = useTranslation();

  if (!onAddAsset) {
    return null;
  }

  return (
    <Box lx={{ alignItems: "center", gap: "s12" }}>
      <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
        {t("payTab.card.assets.manageDialog.addAssetCaption")}
      </Text>
      <Button appearance="base" size="lg" isFull onPress={onAddAsset} testID="card-assets-add">
        {t("payTab.card.assets.manageDialog.addAsset")}
      </Button>
    </Box>
  );
}
