import React from "react";
import { AssetSuggestionsSectionView } from "./AssetSuggestionsSectionView";
import { useAssetSuggestionsSectionViewModel } from "./hooks/useAssetSuggestionsSectionViewModel";
import { AssetSuggestionsSectionProps } from "./types";

export function AssetSuggestionsSection(props: Readonly<AssetSuggestionsSectionProps>) {
  const { locale } = useAssetSuggestionsSectionViewModel();

  return <AssetSuggestionsSectionView {...props} locale={locale} />;
}
