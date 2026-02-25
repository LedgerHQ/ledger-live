import React from "react";
import { useTranslation } from "react-i18next";
import { GenericStatusDisplay, GenericProps } from "./GenericStatusDisplay";

export const Complete = (props: GenericProps) => {
  const { t } = useTranslation();

  return (
    <GenericStatusDisplay
      {...props}
      title={t("walletSync.success.complete.title")}
      description={t("walletSync.success.complete.description")}
      specificCta={props.specificCta ?? t("walletSync.success.complete.syncAnother")}
      fullHeight
    />
  );
};
