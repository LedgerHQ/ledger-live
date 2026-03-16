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
import { CryptoListContent } from "./components/CryptoListContent";
import usePortfolioCryptosSectionViewModel from "./hooks/usePortfolioCryptosSectionViewModel";

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
        <CryptoListContent
          isLoading={isLoading}
          isError={isError}
          assetsToDisplay={assetsToDisplay}
          onItemPress={onItemPress}
        />
      </Box>
      {hasMore && (
        <Button
          appearance="gray"
          size="lg"
          isFull
          onPress={onPressShowAll}
          lx={{ marginTop: "s24", marginBottom: "s24" }}
        >
          {t("portfolio.seeAllAssets")}
        </Button>
      )}
    </Box>
  );
};

export const PortfolioCryptosSection = withDiscreetMode(PortfolioCryptosSectionComponent);
