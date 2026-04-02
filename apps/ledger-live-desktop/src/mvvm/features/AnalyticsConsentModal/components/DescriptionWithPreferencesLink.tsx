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
    <p className="body-2 text-muted text-center">
      {text}{" "}
      <Link asChild appearance="accent" size="sm" underline={false}>
        <button type="button" onClick={onSetPreferences}>
          {t("analyticsConsentModal.setPreferences")}
        </button>
      </Link>
    </p>
  );
}
