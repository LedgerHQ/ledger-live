import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";

interface SeeAllAssetsButtonProps {
  hasMore: boolean;
  onPress: () => void;
}

export const SeeAllAssetsButton: React.FC<SeeAllAssetsButtonProps> = ({ hasMore, onPress }) => {
  const { t } = useTranslation();

  if (!hasMore) return null;

  return (
    <Button
      appearance="gray"
      size="lg"
      isFull
      onPress={onPress}
      lx={{ marginTop: "s24", marginBottom: "s24" }}
    >
      {t("portfolio.seeAllAssets")}
    </Button>
  );
};
