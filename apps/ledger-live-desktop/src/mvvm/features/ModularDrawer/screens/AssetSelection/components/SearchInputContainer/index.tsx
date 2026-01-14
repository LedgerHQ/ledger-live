import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "@ledgerhq/react-ui/pre-ldls";
import { useSearch } from "./useSearch";
import { Box } from "@ledgerhq/react-ui/index";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const SearchInputContainer = () => {
  const { t } = useTranslation();
  const modularDrawer = useFeature("lldModularDrawer");

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch();

  return (
    <Box flex={1} paddingRight="8px" paddingLeft="8px" marginBottom="24px">
      <Search
        value={displayedValue ?? ""}
        debounceTime={modularDrawer?.params?.searchDebounceTime}
        placeholder={t("modularAssetDrawer.searchPlaceholder")}
        onDebouncedChange={handleDebouncedChange}
        onChange={handleSearch}
        data-testid="modular-asset-drawer-search-input"
        style={{ outline: "none" }}
      />
    </Box>
  );
};

export default React.memo(SearchInputContainer);
