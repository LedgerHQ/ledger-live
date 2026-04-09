import React, { useCallback } from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { openExternalUrl } from "../utils/openExternalUrl";

type PrivacyDescriptionProps = Readonly<{ privacyPolicyUrl: string }>;

export function PrivacyDescription({ privacyPolicyUrl }: PrivacyDescriptionProps) {
  const { t } = useTranslation();
  const onOpenPrivacyPolicy = useCallback(() => {
    openExternalUrl(privacyPolicyUrl);
  }, [privacyPolicyUrl]);

  return (
    <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
      {t("analyticsConsentDrawer.privacy.descriptionLead")}
      <Text
        accessibilityRole="link"
        accessibilityLabel={t("analyticsConsentDrawer.privacy.descriptionLinkLabel")}
        typography="body2"
        lx={{ textDecorationLine: "underline" }}
        onPress={onOpenPrivacyPolicy}
      >
        {t("analyticsConsentDrawer.privacy.descriptionLinkLabel")}
      </Text>
      {t("analyticsConsentDrawer.privacy.descriptionTrail")}
    </Text>
  );
}
