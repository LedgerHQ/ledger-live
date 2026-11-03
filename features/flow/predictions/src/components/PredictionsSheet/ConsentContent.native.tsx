import React from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { DISCLOSURE_COPY } from "../../documents";
import { Acknowledgement } from "./Acknowledgement";
import type { ConsentContentProps } from "./ConsentContent.types";

export function ConsentContent({ version, onAccept }: ConsentContentProps) {
  const { t } = useTranslation();
  const disclosure = DISCLOSURE_COPY[version.disclosureVersion];
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, so the header and actions live inside it.
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <BottomSheetHeader density="compact" spacing />
      <Box lx={{ gap: "s24" }} style={{ paddingBottom: bottomInset + 16 }}>
        <Box lx={{ gap: "s8" }}>
          <Text accessibilityRole="header" typography="heading2SemiBold" lx={{ color: "base" }}>
            {t("predictions.onboarding.consent.title")}
          </Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("predictions.onboarding.consent.description")}
          </Text>
        </Box>
        <Box lx={{ gap: "s20" }}>
          {disclosure.bullets.map(bullet => (
            <Box key={bullet} lx={{ flexDirection: "row" }}>
              <Text typography="body2" lx={{ color: "muted", paddingHorizontal: "s8" }}>
                •
              </Text>
              <Text typography="body2" lx={{ color: "muted", flex: 1 }}>
                {t(bullet)}
              </Text>
            </Box>
          ))}
        </Box>
        <Box lx={{ gap: "s16" }}>
          <Acknowledgement
            acknowledgement={t(disclosure.checkbox)}
            cta={t("predictions.onboarding.consent.cta")}
            disclaimer={t(disclosure.footer)}
            onConfirm={onAccept}
          />
        </Box>
      </Box>
    </BottomSheetScrollView>
  );
}
