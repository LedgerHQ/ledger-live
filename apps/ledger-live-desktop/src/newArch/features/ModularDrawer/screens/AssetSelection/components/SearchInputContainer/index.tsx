import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";
import { Box } from "@ledgerhq/react-ui/index";

type Props = SearchProps;

const SearchInputContainer = ({
  setItemsToDisplay,
  setSearchedValue,
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
  });

  return (
    <Box flex={1} paddingRight="8px" paddingLeft="8px" marginBottom="24px">
      <Search
        value={displayedValue}
        placeholder={t("modularAssetDrawer.searchPlaceholder")}
        onDebouncedChange={handleDebouncedChange}
        onChange={handleSearch}
      />
    </Box>
  );
};

export default React.memo(SearchInputContainer);
