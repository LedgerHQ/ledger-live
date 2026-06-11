import React from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";
import { StockRow } from "./components/StockRow";
import { StocksSkeleton } from "./components/StocksSkeleton";
import { StocksHeaderVariant, StocksSectionViewProps } from "./types";

function StocksHeader({
  variant,
  onSeeAll,
}: {
  variant: StocksHeaderVariant;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation();

  if (variant === "explore") {
    return (
      <Subheader>
        <div className="flex items-center gap-24">
          <SubheaderRow className="min-w-0 flex-1">
            <SubheaderTitle>{t("topBar.search.stocks")}</SubheaderTitle>
          </SubheaderRow>
          <Link
            appearance="accent"
            underline={false}
            size="md"
            onClick={onSeeAll}
            className="cursor-pointer"
            data-testid="stocks-explore"
          >
            {t("stocks.explore")}
          </Link>
        </div>
      </Subheader>
    );
  }

  return (
    <Subheader>
      <SubheaderRow
        className="min-w-0 items-center gap-4"
        onClick={onSeeAll}
        data-testid="stocks-see-all"
      >
        <SubheaderTitle>{t("topBar.search.stocks")}</SubheaderTitle>
        <SubheaderShowMore />
      </SubheaderRow>
    </Subheader>
  );
}

export function StocksSectionView({
  data,
  isLoading,
  limit,
  navigateToAsset,
  onSeeAll,
  headerVariant = "showMore",
}: StocksSectionViewProps) {
  if (!isLoading && data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8" data-testid="stocks-section">
      <StocksHeader variant={headerVariant} onSeeAll={onSeeAll} />
      {isLoading ? (
        <StocksSkeleton count={limit} />
      ) : (
        <div
          className="scrollbar-none grid grid-flow-col grid-rows-2 gap-8 overflow-x-auto"
          data-testid="stocks-list"
        >
          {data.map(stock => (
            <StockRow key={stock.id} stock={stock} onClick={navigateToAsset} />
          ))}
        </div>
      )}
    </div>
  );
}
