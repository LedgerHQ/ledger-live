import React from "react";
import { Box, Button, Spot, Text } from "@ledgerhq/lumen-ui-rnative";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { CardAssetWithdrawContentProps } from "./types";

export function CardAssetDetailsWithdrawDrawer({ onContinue }: CardAssetWithdrawContentProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ alignItems: "center", gap: "s32", paddingBottom: "s24" }}>
      <Box lx={{ alignItems: "center", gap: "s24" }}>
        <Spot appearance="icon" icon={InformationFill} size={56} />
        <Box lx={{ alignItems: "center", gap: "s8" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {t("payTab.card.assets.withdraw.title")}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {t("payTab.card.assets.withdraw.description")}
          </Text>
        </Box>
      </Box>
      <Button appearance="base" size="lg" isFull onPress={onContinue}>
        {t("payTab.card.assets.withdraw.continue")}
      </Button>
    </Box>
  );
}
