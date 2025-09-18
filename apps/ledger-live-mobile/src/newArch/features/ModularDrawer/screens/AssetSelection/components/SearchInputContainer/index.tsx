import React from "react";
import { useTranslation } from "react-i18next";
import { SearchProps, useSearch } from "./useSearch";
import { Flex } from "@ledgerhq/native-ui";
import { Search } from "@ledgerhq/native-ui/pre-ldls/index";
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
    <Flex mb={4}>
      <Search
        onFocus={onFocus}
        onBlur={onBlur}
        onPressIn={onPressIn}
        value={displayedValue}
        debounceTime={modularDrawer?.params?.searchDebounceTime}
        placeholder={t("modularDrawer.searchPlaceholder")}
        onDebouncedChange={handleDebouncedChange}
        onChange={e => handleSearch(e.nativeEvent.text)}
      />
    </Flex>
  );
};

export default React.memo(SearchInputContainer);
