import React, { ReactNode, useState, memo } from "react";
import { SearchInput, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import Search from "./Search";

type Props = {
  initialQuery?: string;
  renderList: (list: any[]) => ReactNode;
  renderEmptySearch: () => ReactNode;
  keys?: string[];
  list: any[];
  inputWrapperStyle?: any;
};

const FilteredSearchBar = ({
  keys = ["name"],
  initialQuery,
  renderList,
  list,
  renderEmptySearch,
  inputWrapperStyle,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [query, setQuery] = useState<string>(initialQuery || "");

  return (
    <>
      <Flex style={inputWrapperStyle}>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("common.search")}
          placeholderTextColor={colors.neutral.c70}
          color={colors.neutral.c100}
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

export default memo<Props>(FilteredSearchBar);
