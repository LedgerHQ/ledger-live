import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type DescriptionWithPreferencesLinkProps = Readonly<{
  text: string;
  onSetPreferences: () => void;
}>;

export function DescriptionWithPreferencesLink({
  text,
  onSetPreferences,
}: DescriptionWithPreferencesLinkProps) {
  const { t } = useTranslation();
  return (
    <Box lx={{ width: "full", alignItems: "center", gap: "s4" }}>
      <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
        {text}
      </Text>
      <Text
        accessibilityRole="link"
        onPress={onSetPreferences}
        typography="body2"
        lx={{ color: "interactive", textAlign: "center", width: "full" }}
      >
        {t("analyticsConsentDrawer.setPreferences")}
      </Text>
    </Box>
  );
}
