import React from "react";
import {
  AmountDisplay,
  Box,
  Spot,
  Text,
  ThemeProvider,
  type SupportedLocale,
} from "@ledgerhq/lumen-ui-rnative";
import { ledgerLiveThemes } from "@ledgerhq/lumen-design-core";
import { Snow } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import type { CardVisualViewProps } from "../../types";

export function CardVisualView({
  balance,
  formatCountervalue,
  balanceLabel,
  isLoading = false,
  isFrozen,
}: CardVisualViewProps) {
  const { i18n } = useTranslation();

  return (
    <ThemeProvider
      themes={ledgerLiveThemes}
      colorScheme="dark"
      locale={i18n.language as SupportedLocale}
    >
      <Box style={{ position: "relative" }} testID="card-visual">
        <Box style={{ opacity: isFrozen ? 0.5 : 1 }}>
          <CardArtwork />
          <Box
            lx={{ gap: "s8", padding: "s16" }}
            style={{ position: "absolute", top: 0, left: 0, right: 0 }}
          >
            <Text typography="body2" lx={{ color: "muted" }}>
              {balanceLabel}
            </Text>
            <AmountDisplay
              value={balance}
              formatter={formatCountervalue}
              loading={isLoading}
              size="sm"
              testID="card-visual-amount"
            />
          </Box>
        </Box>

        {isFrozen ? (
          <Box
            lx={{ alignItems: "center", justifyContent: "center" }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <Spot appearance="icon" icon={Snow} size={56} testID="card-visual-frozen" />
          </Box>
        ) : null}
      </Box>
    </ThemeProvider>
  );
}
