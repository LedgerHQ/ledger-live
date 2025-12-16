import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";

type ErrorType = "network" | "backend";
type Props = { onClick?: () => void; type?: ErrorType };

export const GenericError = ({ onClick, type = "backend" }: Props) => {
  const { t } = useTranslation();

  return (
    <Banner
      appearance="error"
      title={t(`modularAssetDrawer.errors.${type}.title`)}
      description={t(`modularAssetDrawer.errors.${type}.description`)}
      primaryAction={
        onClick ? (
          <Button appearance="transparent" size="sm" onClick={onClick}>
            {t("modularAssetDrawer.errors.cta")}
          </Button>
        ) : undefined
      }
    />
  );
};
