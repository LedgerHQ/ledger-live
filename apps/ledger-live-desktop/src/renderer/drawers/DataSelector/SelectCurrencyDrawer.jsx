// @flow

import React, { useMemo, useState, memo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/react-ui";

import Fuse from "fuse.js";

import type { Currency } from "@ledgerhq/live-common/types/index";

import {
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/currencies/index";
import { makeRe } from "@ledgerhq/live-common/platform/filters";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { CurrencyList } from "./CurrencyList";

const options = {
  includeScore: false,
  threshold: 0.1,
  // Search in `ticker` and in `name` values
  keys: ["name", "ticker"],
  shouldSort: false,
};

function fuzzySearch(currencies: Currency[], searchValue: string) {
  const fuse = new Fuse(currencies, options);

  const result: Currency[] = fuse.search(searchValue);

  return result;
}

const SelectCurrencyDrawerContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
`;

const HeaderContainer: ThemedComponent<any> = styled.div`
  padding: 40px 0px 32px 0px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type SelectCurrencyDrawerProps = {
  currencies?: string[],
  includeTokens?: boolean,
  onCurrencySelected: (currency: Currency) => void,
};

const SearchInputContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;

const SelectCurrencyDrawer = ({
  currencies,
  includeTokens,
  onCurrencySelected,
}: SelectCurrencyDrawerProps) => {
  const { t } = useTranslation();

  const cryptoCurrencies = useMemo(() => {
    const allCurrencies = includeTokens
      ? [...listSupportedCurrencies(), ...listTokens()]
      : listSupportedCurrencies();

    const filterCurrencyRegexes = currencies ? currencies.map(filter => makeRe(filter)) : null;

    return currencies
      ? allCurrencies.filter(currency => {
          if (
            filterCurrencyRegexes &&
            !filterCurrencyRegexes.some(regex => currency.id.match(regex))
          ) {
            return false;
          }

          return true;
        })
      : allCurrencies;
  }, [currencies, includeTokens]);

  const [searchValue, setSearchValue] = useState<string>("");

  // sorting them by marketcap
  const sortedCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);

  // performing fuzzy search if there is a valid searchValue
  const filteredCurrencies = useMemo(() => {
    if (searchValue.length < 2) {
      return sortedCurrencies;
    }
    return fuzzySearch(sortedCurrencies, searchValue);
  }, [searchValue, sortedCurrencies]);

  return (
    <SelectCurrencyDrawerContainer>
      <HeaderContainer>
        <Text
          ff="Inter|Medium"
          color="palette.text.shade100"
          fontSize="24px"
          style={{ textTransform: "uppercase" }}
        >
          {t("drawers.selectCurrency.title")}
        </Text>
      </HeaderContainer>
      <SelectorContent>
        <SearchInputContainer>
          <SearchInput value={searchValue} onChange={setSearchValue} />
        </SearchInputContainer>
        <CurrencyList currencies={filteredCurrencies} onCurrencySelect={onCurrencySelected} />
      </SelectorContent>
    </SelectCurrencyDrawerContainer>
  );
};

export default memo<SelectCurrencyDrawerProps>(SelectCurrencyDrawer);
