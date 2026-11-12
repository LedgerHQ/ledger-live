import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

export function ErrorBanner({ error, warning }: Readonly<{ error: Error; warning?: boolean }>) {
  const { t, i18n } = useTranslation();
  const values = { ...error, message: error.message };
  const titleKey = `errors.${error.name}.title`;
  const descriptionKey = `errors.${error.name}.description`;

  return (
    <Banner
      appearance={warning ? "warning" : "error"}
      title={t(i18n.exists(titleKey) ? titleKey : "errors.generic.title", values)}
      description={i18n.exists(descriptionKey) ? t(descriptionKey, values) : undefined}
    />
  );
}
