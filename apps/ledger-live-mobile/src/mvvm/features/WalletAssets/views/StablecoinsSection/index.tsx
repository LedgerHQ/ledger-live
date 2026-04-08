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
import usePortfolioStablecoinsSectionViewModel from "./usePortfolioStablecoinsSectionViewModel";
import { EMPTY_STATE_MAX_STABLECOINS } from "LLM/features/WalletAssets/constants";
import { WalletAssetsVariant } from "LLM/features/WalletAssets/types";

interface PortfolioStablecoinsSectionProps {
  variant?: WalletAssetsVariant;
}

const PortfolioStablecoinsSectionComponent: React.FC<PortfolioStablecoinsSectionProps> = ({
  variant,
}) => {
  const { t } = useTranslation();
  const { assetsCount, hasMore, assetsToDisplay, isLoading, isError, onPressShowAll, onItemPress } =
    usePortfolioStablecoinsSectionViewModel({ variant });

  if (!isLoading && !isError && assetsCount === 0) return null;

  return (
    <Box>
      <Subheader>
        <SubheaderRow
          onPress={hasMore ? onPressShowAll : undefined}
          accessibilityRole={hasMore ? "button" : undefined}
          lx={{ marginBottom: "s12" }}
          testID="portfolio-stablecoins-section-header"
        >
          <SubheaderTitle>{t("wallet.tabs.stablecoins")}</SubheaderTitle>
          {hasMore && (
            <>
              <SubheaderCount value={assetsCount} />
              <SubheaderShowMore />
            </>
          )}
        </SubheaderRow>
      </Subheader>
      <Box testID="PortfolioStablecoinsList">
        <SectionListContent
          isLoading={isLoading}
          isError={isError}
          assetsToDisplay={assetsToDisplay}
          onItemPress={onItemPress}
          skeletonCount={EMPTY_STATE_MAX_STABLECOINS}
          errorMessage={t("portfolio.assetSection.connectionFailed")}
        />
      </Box>
    </Box>
  );
};

export const PortfolioStablecoinsSection = withDiscreetMode(PortfolioStablecoinsSectionComponent);
