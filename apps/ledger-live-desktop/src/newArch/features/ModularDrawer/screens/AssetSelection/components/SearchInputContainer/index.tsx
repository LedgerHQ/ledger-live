import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";
import { Box } from "@ledgerhq/react-ui/index";

type Props = SearchProps;

const SearchInputContainer = ({
  setItemsToDisplay,
  assetsToDisplay,
  setSearchedValue,
  originalAssets,
  defaultValue = "",
  source,
  flow,
  items,
}: Props) => {
  const { t } = useTranslation();

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch({
    setItemsToDisplay,
    setSearchedValue,
    defaultValue,
    items,
    source,
    flow,
    assetsToDisplay,
    originalAssets,
  });

  return (
    <Box flex={1} paddingRight="8px" paddingLeft="8px" marginBottom="24px">
      <Search
        value={displayedValue}
        placeholder={t("modularAssetDrawer.searchPlaceholder")}
        onDebouncedChange={handleDebouncedChange}
        onChange={handleSearch}
        data-testid="modular-asset-drawer-search-input"
      />
    </Box>
  );
};

export default React.memo(SearchInputContainer);
