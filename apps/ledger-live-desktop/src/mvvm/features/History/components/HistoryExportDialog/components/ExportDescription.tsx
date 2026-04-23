import React from "react";
import { Spot, Banner } from "@ledgerhq/lumen-ui-react";
import { CloudDownload } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

export function ExportDescription() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-16">
      <Spot appearance="icon" icon={CloudDownload} />
      <span className="body-2 text-muted">{t("history.exportDialog.description")}</span>
      <Banner appearance="warning" description={t("history.exportDialog.disclaimer")} />
    </div>
  );
}
