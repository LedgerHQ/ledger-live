import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "~/context/Locale";
import { SearchProps, useSearch } from "./useSearch";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";

const DEFAULT_DEBOUNCE_TIME = 500;

type Props = SearchProps & {
  withHorizontalPadding?: boolean;
};

const SearchInputContainer = ({
  source,
  flow,
  assetsConfiguration,
  formatAssetConfig,
  onPressIn,
  withHorizontalPadding = false,
}: Props) => {
  const { t } = useTranslation();
  const modularDrawer = useFeature("llmModularDrawer");
  const debounceTime = modularDrawer?.params?.searchDebounceTime ?? DEFAULT_DEBOUNCE_TIME;

  const { handleDebouncedChange, handleSearch, displayedValue } = useSearch({
    source,
    flow,
    assetsConfiguration,
    formatAssetConfig,
  });

  const previousValueRef = useRef(displayedValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onChangeText = useCallback(
    (text: string) => {
      handleSearch(text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDebouncedChange(text, previousValueRef.current);
        previousValueRef.current = text;
      }, debounceTime);
    },
    [handleSearch, handleDebouncedChange, debounceTime],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <Box
      onTouchStart={onPressIn}
      lx={{ marginBottom: "s16", ...(withHorizontalPadding ? { paddingHorizontal: "s16" } : {}) }}
    >
      <SearchInput
        value={displayedValue}
        placeholder={t("modularDrawer.searchPlaceholder")}
        onChangeText={onChangeText}
        testID="modular-drawer-search-input"
      />
    </Box>
  );
};

export default React.memo(SearchInputContainer);
