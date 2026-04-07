import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

const SETTINGS_DISPLAY_HASH_HREF = "#/settings/display";

export type DescriptionWithPreferencesLinkProps = Readonly<{
  text: string;
  onSetPreferences: () => void;
}>;

export function DescriptionWithPreferencesLink({
  text,
  onSetPreferences,
}: DescriptionWithPreferencesLinkProps) {
  const { t } = useTranslation();
  return (
    <p className="body-2 text-muted text-center">
      {text}{" "}
      <Link
        appearance="accent"
        size="sm"
        underline={false}
        href={SETTINGS_DISPLAY_HASH_HREF}
        onClick={e => {
          e.preventDefault();
          onSetPreferences();
        }}
      >
        {t("analyticsConsentModal.setPreferences")}
      </Link>
    </p>
  );
}
