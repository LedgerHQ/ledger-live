import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

export const SuccessContent = () => {
  const { t } = useTranslation();

  return (
    <>
      <Spot appearance="check" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="text-base heading-3-semi-bold">
          {t("send.steps.confirmation.success.title")}
        </h3>
        <p className="text-muted body-2">{t("send.steps.confirmation.success.text")}</p>
      </div>
    </>
  );
};
