import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";

export const SearchInputContainer = ({
  setItemsToDisplay,
  setSearchedValue,
  defaultValue,
  source,
  flow,
  items,
}: SearchProps) => {
  const { t } = useTranslation();

  const { searchQuery, handleSearch, trackSearch } = useSearch({
    setItemsToDisplay,
    setSearchedValue,
    defaultValue,
    items,
    source,
    flow,
  });

  return (
    <Search
      placeholder={t("modularAssetDrawer.searchPlaceholder")}
      value={searchQuery}
      onChange={handleSearch}
      onDebouncedChange={trackSearch}
    />
  );
};
