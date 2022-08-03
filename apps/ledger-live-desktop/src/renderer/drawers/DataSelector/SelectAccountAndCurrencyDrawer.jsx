// @flow

import React, { useMemo, useState, memo, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/react-ui";
import type { Account, AccountLike, Currency } from "@ledgerhq/live-common/types/index";
import { setDrawer } from "../Provider";

import Fuse from "fuse.js";

import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/index";
import { useFilteredCurrencies } from "@ledgerhq/live-common/currencies/react";
import Text from "~/renderer/components/Text";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { CurrencyList } from "./CurrencyList";
import SelectAccountDrawer from "./SelectAccountDrawer";

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

const SelectAccountAndCurrencyDrawerContainer = styled.div`
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

type SelectAccountAndCurrencyDrawerProps = {
  onClose: () => void,
  currencies?: string[],
  includeTokens?: boolean,
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void,
};

const SearchInputContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;

const MemoizedSelectAccountAndCurrencyDrawer = memo<SelectAccountAndCurrencyDrawerProps>(
  function SelectAccountAndCurrencyDrawer(props: SelectAccountAndCurrencyDrawerProps) {
    const { currencies, includeTokens, onAccountSelected, onClose } = props;

    const { t } = useTranslation();

    const cryptoCurrencies = useFilteredCurrencies({ currencies, includeTokens });

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

    const handleCurrencySelected = useCallback(
      currency => {
        setDrawer(
          SelectAccountDrawer,
          {
            currency,
            onAccountSelected,
            onRequestBack: () =>
              setDrawer(MemoizedSelectAccountAndCurrencyDrawer, props, {
                onRequestClose: onClose,
              }),
          },
          {
            onRequestClose: onClose,
          },
        );
      },
      [onAccountSelected, props, onClose],
    );

    if (cryptoCurrencies.length === 1) {
      return (
        <SelectAccountDrawer currency={cryptoCurrencies[0]} onAccountSelected={onAccountSelected} />
      );
    }

    return (
      <SelectAccountAndCurrencyDrawerContainer>
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
          <CurrencyList currencies={filteredCurrencies} onCurrencySelect={handleCurrencySelected} />
        </SelectorContent>
      </SelectAccountAndCurrencyDrawerContainer>
    );
  },
);

export default MemoizedSelectAccountAndCurrencyDrawer;
