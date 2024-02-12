import React, { ReactNode, useState, memo, useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SearchInput, SquaredSearchBar, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import Search from "./Search";

type Props<T> = {
  initialQuery?: string;
  renderList: (_: T[]) => ReactNode;
  renderEmptySearch: () => ReactNode;
  keys?: string[];
  list: T[];
  inputWrapperStyle?: StyleProp<ViewStyle>;
  newSearchBar?: boolean;
  onSearchChange?: (newQuery: string) => void;
};

const FilteredSearchBar = <T,>({
  keys = ["name"],
  initialQuery,
  renderList,
  list,
  renderEmptySearch,
  inputWrapperStyle,
  newSearchBar,
  onSearchChange,
}: Props<T>) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [query, setQuery] = useState<string>(initialQuery || "");

  const onChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      onSearchChange?.(newQuery);
    },
    [onSearchChange],
  );

  return (
    <>
      <Flex style={inputWrapperStyle}>
        {newSearchBar ? (
          <SquaredSearchBar
            value={query}
            onChange={onChange}
            placeholder={t("common.search")}
            placeholderTextColor={colors.neutral.c70}
            testID="common-search-field"
          />
        ) : (
          <SearchInput
            value={query}
            onChange={onChange}
            placeholder={t("common.search")}
            placeholderTextColor={colors.neutral.c70}
            testID="common-search-field"
          />
        )}
      </Flex>
      <Search
        fuseOptions={{
          threshold: 0.1,
          keys,
          shouldSort: false,
        }}
        value={query}
        items={list}
        render={renderList}
        renderEmptySearch={renderEmptySearch}
      />
    </>
  );
};

export default memo(FilteredSearchBar) as typeof FilteredSearchBar;
