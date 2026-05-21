import React from "react";
import { Banner } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";

export function ExportDescription() {
  const { t } = useTranslation();

  return <Banner appearance="warning" description={t("history.exportDialog.disclaimer")} />;
}
