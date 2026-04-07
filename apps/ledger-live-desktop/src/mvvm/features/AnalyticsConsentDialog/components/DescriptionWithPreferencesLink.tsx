import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@ledgerhq/lumen-ui-react";

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
    <div className="body-2 text-muted text-center">
      <span>{text}</span>
      <Link
        onClick={onSetPreferences}
        href="#set-preferences" // make sure to set href to make the link a11y compliant (even if it's not used)
        appearance="accent"
        size="sm"
        underline={false}
        style={{
          padding: 1,
        }}
      >
        {t("analyticsConsentModal.setPreferences")}
      </Link>
    </div>
  );
}
