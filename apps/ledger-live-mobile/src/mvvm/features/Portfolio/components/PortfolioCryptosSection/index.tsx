import React from "react";
import {
  Box,
  Button,
  Subheader,
  SubheaderCount,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useTranslation } from "~/context/Locale";
import AssetListItem from "./AssetListItem";
import usePortfolioCryptosSectionViewModel from "./usePortfolioCryptosSectionViewModel";

const PortfolioCryptosSectionComponent: React.FC = () => {
  const { t } = useTranslation();
  const { assetsCount, hasMore, assetsToDisplay, onPressShowAll, onItemPress } =
    usePortfolioCryptosSectionViewModel();

  if (assetsCount === 0) return null;

  return (
    <Box>
      <Subheader>
        <SubheaderRow
          onPress={hasMore ? onPressShowAll : undefined}
          accessibilityRole={hasMore ? "button" : undefined}
          lx={{ marginBottom: "s12" }}
        >
          <SubheaderTitle>{t("wallet.tabs.crypto")}</SubheaderTitle>
          {hasMore && (
            <>
              <SubheaderCount value={assetsCount} />
              <SubheaderShowMore />
            </>
          )}
        </SubheaderRow>
      </Subheader>
      <Box testID="PortfolioCryptosList">
        {assetsToDisplay.map(item => (
          <AssetListItem key={item.currency.id} asset={item} onPress={onItemPress} />
        ))}
      </Box>
      {hasMore && (
        <Button
          appearance="gray"
          size="lg"
          isFull
          onPress={onPressShowAll}
          lx={{ marginTop: "s24", marginBottom: "s48" }}
        >
          {t("portfolio.seeAllAssets")}
        </Button>
      )}
    </Box>
  );
};

export const PortfolioCryptosSection = withDiscreetMode(PortfolioCryptosSectionComponent);
