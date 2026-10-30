import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Coins } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { resolveEmptyStateDescription } from "../../logic/resolveEmptyStateDescription";
import type { AccountEmptyStateProps } from "./types";

export function AccountEmptyState({ fundingActions, testID }: AccountEmptyStateProps) {
  const { t } = useTranslation();
  const description = resolveEmptyStateDescription(fundingActions);

  return (
    <Box lx={{ alignItems: "center", justifyContent: "center", gap: "s24" }} testID={testID}>
      <Coins size={40} color="base" />
      <Box lx={{ width: "full", alignItems: "center", gap: "s8" }}>
        <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
          {t("accountDetailHero.emptyState.title")}
        </Text>
        {description ? (
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {t(`accountDetailHero.emptyState.description.${description}`)}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
