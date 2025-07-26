import React from "react";
import { useTranslation } from "react-i18next";
import { SearchProps, useSearch } from "./useSearch";
import { Flex } from "@ledgerhq/native-ui";
import { Search } from "@ledgerhq/native-ui/pre-ldls/index";

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
  assetsConfiguration,
  formatAssetConfig,
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
    assetsConfiguration,
    formatAssetConfig,
  });

  return (
    <Flex paddingX="8px" mb={24}>
      <Search
        value={displayedValue}
        placeholder={t("modularDrawer.searchPlaceholder")}
        onDebouncedChange={handleDebouncedChange}
        onChange={e => handleSearch(e.nativeEvent.text)}
      />
    </Flex>
  );
};

export default React.memo(SearchInputContainer);
