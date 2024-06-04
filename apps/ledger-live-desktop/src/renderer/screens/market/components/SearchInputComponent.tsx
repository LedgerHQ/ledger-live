import { Flex, SearchInput } from "@ledgerhq/react-ui";

import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
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
  return (
    <SearchContainer>
      <SearchInput
        data-test-id="market-search-input"
        value={search}
        onChange={updateSearch}
        placeholder={t("common.search")}
        clearable
      />
    </SearchContainer>
  );
}

export default withV3StyleProvider(SearchInputComponent);
