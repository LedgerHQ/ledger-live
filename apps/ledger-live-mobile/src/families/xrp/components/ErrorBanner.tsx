import React from "react";
import { useTranslation } from "~/context/Locale";
import { FullTextBanner } from "./FullTextBanner";

export function ErrorBanner({ error }: Readonly<{ error: Error }>) {
  const { t, i18n } = useTranslation();
  const values = { ...error, message: error.message };
  const titleKey = `errors.${error.name}.title`;
  const descriptionKey = `errors.${error.name}.description`;

  return (
    <FullTextBanner
      appearance="error"
      title={t(i18n.exists(titleKey) ? titleKey : "errors.generic.title", values)}
      description={i18n.exists(descriptionKey) ? t(descriptionKey, values) : undefined}
    />
  );
}
