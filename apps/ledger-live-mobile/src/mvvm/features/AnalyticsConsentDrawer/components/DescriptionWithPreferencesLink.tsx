import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
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
    <Text typography="body2" lx={{ color: "muted", textAlign: "center", width: "full" }}>
      {text}{" "}
      <Text typography="body2" lx={{ color: "interactive" }} onPress={onSetPreferences}>
        {t("analyticsConsentDrawer.setPreferences")}
      </Text>
    </Text>
  );
}
