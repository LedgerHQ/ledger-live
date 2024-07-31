import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { Flex, SearchInput } from "@ledgerhq/react-ui";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const SearchContainer = styled(Flex).attrs({ flexShrink: "1" })`
  > div {
    width: 100%;
  }
`;

type Props = {
  search: string;
  updateSearch: (value: string) => void;
};

function SearchInputComponent({ search, updateSearch }: Props) {
  const { t } = useTranslation();

  const [inputSearch, setInputSearch] = useState(search);
  const debouncedSearch = useDebounce(inputSearch, 300);

  useEffect(() => {
    track("Page Market Query", {
      currencyName: debouncedSearch,
    });
    updateSearch(debouncedSearch ? debouncedSearch.trim() : "");
  }, [debouncedSearch, updateSearch]);

  useEffect(() => {
    setInputSearch(search);
  }, [search]);

  return (
    <SearchContainer>
      <SearchInput
        data-testid="market-search-input"
        value={inputSearch}
        onChange={setInputSearch}
        placeholder={t("common.search")}
        clearable
      />
    </SearchContainer>
  );
}

export default withV3StyleProvider(SearchInputComponent);
