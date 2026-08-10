import React from "react";
import { Banner, Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

type Props = { onClick?: () => void; type: "backend" | "internet" };

export const GenericError = ({ onClick, type }: Props) => {
  const { t } = useTranslation();

  return (
    <Box lx={{ paddingHorizontal: "s16" }}>
      <Banner
        appearance="error"
        title={t("modularDrawer.errors.title")}
        description={t(`modularDrawer.errors.${type}`)}
        primaryAction={
          onClick ? (
            <Button appearance="transparent" size="sm" onPress={onClick}>
              {t("modularDrawer.errors.cta")}
            </Button>
          ) : undefined
        }
      />
    </Box>
  );
};
