import React, { useCallback } from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { openExternalUrl } from "../utils/openExternalUrl";

type ConsentFooterProps = Readonly<{ privacyPolicyUrl: string }>;

export function ConsentFooter({ privacyPolicyUrl }: ConsentFooterProps) {
  const { t } = useTranslation();
  const onOpenPrivacyPolicy = useCallback(() => {
    openExternalUrl(privacyPolicyUrl);
  }, [privacyPolicyUrl]);

  return (
    <Box lx={{ width: "full", alignItems: "center" }}>
      <Text typography="body4" lx={{ color: "muted", textAlign: "center" }}>
        {t("analyticsConsentDrawer.footer.lead")}{" "}
        <Text
          accessibilityRole="link"
          onPress={onOpenPrivacyPolicy}
          typography="body4"
          lx={{ textDecorationLine: "underline" }}
        >
          {t("analyticsConsentDrawer.footer.privacyLink")}
        </Text>
      </Text>
    </Box>
  );
}
