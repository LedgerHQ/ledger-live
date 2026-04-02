import React from "react";
import { useTranslation } from "react-i18next";

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
      <button
        type="button"
        className="body-2 text-interactive cursor-pointer bg-transparent p-0 text-center"
        onClick={onSetPreferences}
      >
        {t("analyticsConsentModal.setPreferences")}
      </button>
    </p>
  );
}
