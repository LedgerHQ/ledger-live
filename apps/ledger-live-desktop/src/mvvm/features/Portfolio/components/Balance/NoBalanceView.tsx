import React from "react";
import { useTranslation } from "react-i18next";

export const NoBalanceView = () => {
  const { t } = useTranslation();
  return (
    <span data-testid="no-balance-title" className="heading-1-semi-bold text-base">
      {t("portfolio.noBalanceTitle")}
    </span>
  );
};
