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
import usePortfolioCryptosSectionViewModel, {
  EMPTY_STATE_MAX_ASSETS,
} from "./usePortfolioCryptosSectionViewModel";

interface PortfolioCryptosSectionProps {
  isEmptyState?: boolean;
  isReadOnly?: boolean;
}

const PortfolioCryptosSectionComponent: React.FC<PortfolioCryptosSectionProps> = ({
  isEmptyState,
  isReadOnly,
}) => {
  const { t } = useTranslation();
  const { assetsCount, hasMore, assetsToDisplay, isLoading, isError, onPressShowAll, onItemPress } =
    usePortfolioCryptosSectionViewModel({ isEmptyState, isReadOnly });

  if (!isLoading && !isError && assetsCount === 0) return null;

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
        <SectionListContent
          isLoading={isLoading}
          isError={isError}
          assetsToDisplay={assetsToDisplay}
          onItemPress={onItemPress}
          skeletonCount={EMPTY_STATE_MAX_ASSETS}
          errorMessage={t("portfolio.assetSection.connectionFailed")}
        />
      </Box>
    </Box>
  );
};

export const PortfolioCryptosSection = withDiscreetMode(PortfolioCryptosSectionComponent);
