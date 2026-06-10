import React from "react";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-react";
import { AssetSuggestionRow } from "./components/AssetSuggestionRow";
import { AssetSuggestionsSkeleton } from "./components/AssetSuggestionsSkeleton";
import { AssetSuggestionsSectionViewProps } from "./types";

export function AssetSuggestionsSectionView({
  data,
  isLoading,
  title,
  limit,
  testIdPrefix,
  navigateToAsset,
  onSeeAll,
  locale,
  counterCurrency,
}: Readonly<AssetSuggestionsSectionViewProps>) {
  // Hide empty sections (e.g. backend returned nothing) once loading is done.
  if (!isLoading && data.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8" data-testid={`${testIdPrefix}-section`}>
      <Subheader>
        <SubheaderRow
          className="min-w-0 items-center gap-4"
          onClick={onSeeAll}
          data-testid={`${testIdPrefix}-see-all`}
        >
          <SubheaderTitle>{title}</SubheaderTitle>
          <SubheaderShowMore />
        </SubheaderRow>
      </Subheader>
      {isLoading ? (
        <AssetSuggestionsSkeleton count={limit} testIdPrefix={testIdPrefix} />
      ) : (
        <div className="flex flex-col -mx-8" data-testid={`${testIdPrefix}-list`}>
          {data.map(currency => (
            <AssetSuggestionRow
              key={currency.id}
              currency={currency}
              counterCurrency={counterCurrency}
              locale={locale}
              testIdPrefix={testIdPrefix}
              onClick={navigateToAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
