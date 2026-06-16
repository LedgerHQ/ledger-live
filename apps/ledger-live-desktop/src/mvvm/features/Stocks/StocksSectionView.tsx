import React from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";
import { StockPill } from "./components/StockPill";
import { StocksSkeleton } from "./components/StocksSkeleton";
import { splitIntoTwoRows } from "./utils/splitIntoTwoRows";
import type { StockSuggestion, StocksHeaderVariant, StocksSectionViewProps } from "./types";

function StocksHeader({
  variant,
  onSeeAll,
}: Readonly<{
  variant: StocksHeaderVariant;
  onSeeAll: () => void;
}>) {
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

function StocksList({
  data,
  navigateToAsset,
}: Readonly<{
  data: StockSuggestion[];
  navigateToAsset: (currencyId: string) => void;
}>) {
  const rows = splitIntoTwoRows(data);

  return (
    <div className="scrollbar-none overflow-x-auto" data-testid="stocks-list">
      <div className="flex w-max flex-col gap-8">
        {rows.map((rowStocks, rowIndex) => (
          <div
            key={rowIndex === 0 ? "top" : "bottom"}
            className="flex gap-8"
            data-testid="stocks-row"
          >
            {rowStocks.map(stock => (
              <StockPill key={stock.id} stock={stock} onClick={navigateToAsset} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StocksSectionView({
  data,
  isLoading,
  limit,
  navigateToAsset,
  onSeeAll,
  headerVariant = "showMore",
}: Readonly<StocksSectionViewProps>) {
  if (!isLoading && data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8" data-testid="stocks-section">
      <StocksHeader variant={headerVariant} onSeeAll={onSeeAll} />
      {isLoading ? (
        <StocksSkeleton count={limit} />
      ) : (
        <StocksList data={data} navigateToAsset={navigateToAsset} />
      )}
    </div>
  );
}
