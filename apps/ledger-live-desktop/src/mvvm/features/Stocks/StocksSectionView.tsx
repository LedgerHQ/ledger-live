import React from "react";
import { useTranslation } from "react-i18next";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";
import { StockRow } from "./components/StockRow";
import { StocksSkeleton } from "./components/StocksSkeleton";
import { StocksSectionViewProps } from "./types";

export function StocksSectionView({
  data,
  isLoading,
  limit,
  navigateToAsset,
  onSeeAll,
}: StocksSectionViewProps) {
  const { t } = useTranslation();

  if (!isLoading && data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8" data-testid="stocks-section">
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
