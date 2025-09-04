import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { SearchProps, useSearch } from "./useSearch";
import { Box } from "@ledgerhq/react-ui/index";

type Props = SearchProps;

const SearchInputContainer = ({ source, flow }: Props) => {
  const { t } = useTranslation();

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch({
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
        data-testid="modular-asset-drawer-search-input"
      />
    </Box>
  );
};

export default React.memo(SearchInputContainer);
