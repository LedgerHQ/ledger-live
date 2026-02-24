import React from "react";
import { useTranslation } from "react-i18next";
import { Spot } from "@ledgerhq/lumen-ui-react";

export const SuccessContent = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col items-center gap-24 pt-16"
      data-testid="send-confirmation-success-content"
    >
      <Spot appearance="check" size={72} />
      <div className="flex flex-col items-center gap-12 text-center">
        <h3 className="heading-3-semi-bold text-base" data-testid="send-confirmation-success-title">
          {t("send.steps.confirmation.success.title")}
        </h3>
        <p className="body-2 text-muted">{t("send.steps.confirmation.success.text")}</p>
      </div>
    </div>
  );
};
