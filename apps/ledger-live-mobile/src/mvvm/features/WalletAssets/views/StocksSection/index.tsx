import React from "react";
import {
  Box,
  Subheader,
  SubheaderCount,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import { useTranslation } from "~/context/Locale";
import { SectionListContent } from "../../components/SectionListContent";
import usePortfolioStocksSectionViewModel from "./usePortfolioStocksSectionViewModel";
import { StocksDiscoverySection } from "./StocksDiscoverySection";
import { EMPTY_STATE_MAX_STOCKS } from "LLM/features/WalletAssets/constants";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface PortfolioStocksSectionProps {
  variant?: WalletAssetsVariant;
}

const PortfolioStocksSectionComponent: React.FC<PortfolioStocksSectionProps> = ({ variant }) => {
  const { t } = useTranslation();
  const { stocksCount, hasMore, stocksToDisplay, isLoading, isError, onPressShowAll, onItemPress } =
    usePortfolioStocksSectionViewModel({ variant });

  if (!isLoading && !isError && stocksCount === 0) return <StocksDiscoverySection />;

  return (
    <Box>
      <Subheader>
        <SubheaderRow
          onPress={hasMore ? onPressShowAll : undefined}
          accessibilityRole={hasMore ? "button" : undefined}
          lx={{ marginBottom: "s4" }}
          testID="portfolio-stocks-section-header"
        >
          <SubheaderTitle>{t("wallet.tabs.stocks")}</SubheaderTitle>
          {hasMore && (
            <>
              <SubheaderCount value={stocksCount} />
              <SubheaderShowMore />
            </>
          )}
        </SubheaderRow>
      </Subheader>
      <Box testID="PortfolioStocksList">
        <SectionListContent
          isLoading={isLoading}
          isError={isError}
          assetsToDisplay={stocksToDisplay}
          onItemPress={onItemPress}
          skeletonCount={EMPTY_STATE_MAX_STOCKS}
          errorMessage={t("portfolio.assetSection.connectionFailed")}
        />
      </Box>
    </Box>
  );
};

export const PortfolioStocksSection = withDiscreetMode(PortfolioStocksSectionComponent);
