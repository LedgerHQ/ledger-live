import React from "react";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";

type CardAssetsManageFooterProps = Readonly<{
  onAddAsset?: () => void;
}>;

export function CardAssetsManageFooter({ onAddAsset }: CardAssetsManageFooterProps) {
  const { t } = useTranslation();

  if (!onAddAsset) {
    return null;
  }

  return (
    <Box lx={{ alignItems: "center", gap: "s12", paddingTop: "s16" }}>
      <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
        {t("payTab.card.assets.manageDialog.addAssetCaption")}
      </Text>
      <Button appearance="base" size="lg" isFull onPress={onAddAsset} testID="card-assets-add">
        {t("payTab.card.assets.manageDialog.addAsset")}
      </Button>
    </Box>
  );
}
