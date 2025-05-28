import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";
import { Box } from "@ledgerhq/react-ui/index";

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
    <Box flex={1} paddingRight="8px" paddingLeft="8px" marginBottom="24px">
      <Search
        value={searchQuery}
        placeholder={t("modularAssetDrawer.searchPlaceholder")}
        onChange={handleSearch}
        onDebouncedChange={trackSearch}
      />
    </Box>
  );
};
