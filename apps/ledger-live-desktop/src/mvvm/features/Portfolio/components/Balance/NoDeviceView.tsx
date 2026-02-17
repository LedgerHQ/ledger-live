import React from "react";
import { useTranslation } from "react-i18next";

export const NoDeviceView = () => {
  const { t } = useTranslation();
  return (
    <span data-testid="no-device-title" className="heading-1-semi-bold text-base">
      {t("portfolio.noDeviceTitle")}
    </span>
  );
};
