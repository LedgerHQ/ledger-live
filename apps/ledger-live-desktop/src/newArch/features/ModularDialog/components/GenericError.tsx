import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button } from "@ledgerhq/ldls-ui-react";

export type ErrorType = "network" | "backend";

type Props = {
  onClick: () => void;
  errorType?: ErrorType;
};

export const GenericError = ({ onClick, errorType = "backend" }: Props) => {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="error"
      title={t(`modularAssetDrawer.errors.${errorType}.title`)}
      description={t(`modularAssetDrawer.errors.${errorType}.description`)}
      primaryAction={
        <Button appearance="transparent" size="sm" onClick={onClick}>
          {t("modularAssetDrawer.errors.cta")}
        </Button>
      }
    />
  );
};
