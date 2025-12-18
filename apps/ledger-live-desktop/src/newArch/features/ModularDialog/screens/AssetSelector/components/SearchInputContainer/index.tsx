import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "LLD/components/Search";
import { useSearch } from "./useSearch";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

const SearchInputContainer = () => {
  const { t } = useTranslation();
  const modularDrawer = useFeature("lldModularDrawer");

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch();

  return (
    <div className="mb-12 flex-1 px-8 pt-4">
      <Search
        value={displayedValue ?? ""}
        placeholder={t("modularAssetDrawer.searchPlaceholder")}
        debounceTime={modularDrawer?.params?.searchDebounceTime}
        onChange={handleSearch}
        onDebouncedChange={handleDebouncedChange}
        data-testid="modular-asset-drawer-search-input"
      />
    </div>
  );
};

export default React.memo(SearchInputContainer);
