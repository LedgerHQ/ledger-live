import React, { ReactNode, useState, memo, useCallback } from "react";
import { StyleProp, ViewStyle } from "react-native";
import { SearchInput, Flex } from "@ledgerhq/native-ui";
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
  onSearchChange?: (newQuery: string) => void;
};

const FilteredSearchBar = <T,>({
  keys = ["name"],
  initialQuery,
  renderList,
  list,
  renderEmptySearch,
  inputWrapperStyle,
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
      <Flex style={inputWrapperStyle} mb={2}>
        <SearchInput
          value={query}
          onChange={onChange}
          placeholder={t("common.search")}
          placeholderTextColor={colors.neutral.c70}
          testID="common-search-field"
        />
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
