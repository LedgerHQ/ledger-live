import React, { ReactNode, useState, memo, useCallback } from "react";
import { SearchInput, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";

import { useRoute } from "@react-navigation/native";
import Search from "./Search";
import { track } from "../analytics";
import { ScreenName } from "../const";

type Props = {
  initialQuery?: string;
  renderList: (_: any[]) => ReactNode;
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
  const route = useRoute();

  const onChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      if (route.name === ScreenName.ReceiveSelectCrypto) {
        track("search_clicked", { input: newQuery });
      }
    },
    [route.name],
  );

  return (
    <>
      <Flex style={inputWrapperStyle}>
        <SearchInput
          value={query}
          onChange={onChange}
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
