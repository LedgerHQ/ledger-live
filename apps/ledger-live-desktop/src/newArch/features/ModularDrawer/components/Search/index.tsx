import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";

export const SearchItem = ({ setItemsToDisplay, source, flow, items }: SearchProps) => {
  const { t } = useTranslation();

  const { searchQuery, handleSearch, trackSearch } = useSearch({
    setItemsToDisplay,
    items,
    source,
    flow,
  });

  return (
    <Search
      placeholder={t("modularAssetDrawer.searchPlaceholder")}
      value={searchQuery}
      onChange={e => handleSearch(e.target.value)}
      onDebouncedChange={trackSearch}
    />
  );
};
