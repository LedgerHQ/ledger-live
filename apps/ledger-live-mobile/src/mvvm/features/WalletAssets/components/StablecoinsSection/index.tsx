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
import AssetListItem from "../CryptosSection/components/AssetListItem";
import usePortfolioStablecoinsSectionViewModel from "./usePortfolioStablecoinsSectionViewModel";

interface PortfolioStablecoinsSectionProps {
  isEmptyState?: boolean;
  isReadOnly?: boolean;
}

const PortfolioStablecoinsSectionComponent: React.FC<PortfolioStablecoinsSectionProps> = ({
  isEmptyState,
  isReadOnly,
}) => {
  const { t } = useTranslation();
  const { assetsCount, hasMore, assetsToDisplay, onPressShowAll, onItemPress } =
    usePortfolioStablecoinsSectionViewModel({ isEmptyState, isReadOnly });

  if (assetsCount === 0) return null;

  return (
    <Box>
      <Subheader>
        <SubheaderRow
          onPress={hasMore ? onPressShowAll : undefined}
          accessibilityRole={hasMore ? "button" : undefined}
          lx={{ marginBottom: "s12" }}
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
        {assetsToDisplay.map(item => (
          <AssetListItem key={item.currency.id} asset={item} onPress={onItemPress} />
        ))}
      </Box>
    </Box>
  );
};

export const PortfolioStablecoinsSection = withDiscreetMode(
  PortfolioStablecoinsSectionComponent,
);
