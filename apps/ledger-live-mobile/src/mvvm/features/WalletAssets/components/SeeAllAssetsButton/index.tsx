import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useTranslation } from "~/context/Locale";
import usePortfolioCryptosSectionViewModel from "../CryptosSection/hooks/usePortfolioCryptosSectionViewModel";

const SeeAllAssetsButtonComponent: React.FC = () => {
  const { t } = useTranslation();
  const { hasMore, onPressShowAll } = usePortfolioCryptosSectionViewModel();

  if (!hasMore) return null;

  return (
    <Button
      appearance="gray"
      size="lg"
      isFull
      onPress={onPressShowAll}
      lx={{ marginTop: "s24", marginBottom: "s24" }}
    >
      {t("portfolio.seeAllAssets")}
    </Button>
  );
};

export const SeeAllAssetsButton = withDiscreetMode(SeeAllAssetsButtonComponent);
