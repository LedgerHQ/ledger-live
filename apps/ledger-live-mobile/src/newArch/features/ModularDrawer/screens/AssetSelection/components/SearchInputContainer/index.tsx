import React from "react";
import { useTranslation } from "react-i18next";
import { SearchProps, useSearch } from "./useSearch";
import { Flex } from "@ledgerhq/native-ui";
import { Search } from "LLM/components/Search";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

type Props = SearchProps & {
  onFocus: () => void;
  onBlur: () => void;
};

const SearchInputContainer = ({
  source,
  flow,
  assetsConfiguration,
  formatAssetConfig,
  onPressIn,
  onFocus,
  onBlur,
}: Props) => {
  const { t } = useTranslation();
  const modularDrawer = useFeature("llmModularDrawer");

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch({
    source,
    flow,
    assetsConfiguration,
    formatAssetConfig,
  });

  return (
    <Flex mb={4} px={16}>
      <Search
        onFocus={onFocus}
        onBlur={onBlur}
        onPressIn={onPressIn}
        value={displayedValue ?? ""}
        placeholder={t("modularDrawer.searchPlaceholder")}
        debounceTime={modularDrawer?.params?.searchDebounceTime}
        onChange={handleSearch}
        onDebouncedChange={handleDebouncedChange}
        data-testid="modular-asset-dialog-search-input"
      />
    </Flex>
  );
};

export default React.memo(SearchInputContainer);
