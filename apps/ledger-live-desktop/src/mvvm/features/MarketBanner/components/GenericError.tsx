import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";
import { Warning } from "@ledgerhq/lumen-ui-react/symbols";

const GenericError = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-8" data-testid="generic-error">
      <Spot appearance="icon" icon={Warning} />
      <span className="body-2-semi-bold text-base">{t("marketBanner.genericError")}</span>
    </div>
  );
};

export default GenericError;
