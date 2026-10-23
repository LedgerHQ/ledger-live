import React from "react";
import { StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { Trans, useTranslation } from "@shared/i18n";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { DISCLAIMER_COPY, TERMS_OF_USE_URLS } from "../../documents";
import { AcknowledgementActions } from "./AcknowledgementActions";
import type { TermsContentProps } from "./TermsContent.types";

export function TermsContent({ versions, onAccept }: TermsContentProps) {
  const { t } = useTranslation();
  const openLink = useOpenLink();
  const termsOfUseUrl = useLocalizedUrl(TERMS_OF_USE_URLS[versions.termsVersion]);
  const disclaimer = DISCLAIMER_COPY[versions.disclaimerVersion];
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, so the header and actions live inside it.
    <BottomSheetScrollView showsVerticalScrollIndicator={false}>
      <BottomSheetHeader title={t("predictions.onboarding.terms.title")} />
      <Box lx={{ gap: "s24" }} style={{ paddingBottom: bottomInset + 8 }}>
        <Text typography="body2" lx={{ color: "base" }}>
          <Trans
            i18nKey={disclaimer.body}
            components={{
              termsLink: (
                <Text
                  typography="body2"
                  lx={{ color: "base" }}
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={() => openLink(termsOfUseUrl)}
                />
              ),
            }}
          />
        </Text>
        <AcknowledgementActions
          acknowledgement={t(disclaimer.checkbox)}
          cta={t("predictions.onboarding.terms.cta")}
          onConfirm={onAccept}
        />
      </Box>
    </BottomSheetScrollView>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
  },
});
