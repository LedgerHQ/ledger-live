import React, { useMemo, useState, memo, useCallback } from "react";
import styled from "styled-components";
import { Trans, useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/react-ui";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "../Provider";
import Fuse from "fuse.js";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import Text from "~/renderer/components/Text";
import { CurrencyList } from "./CurrencyList";
import SelectAccountDrawer from "./SelectAccountDrawer";
import { Observable } from "rxjs";
import { getEnv } from "@ledgerhq/live-env";
import { useSelector } from "react-redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import ToggleButton from "~/renderer/components/ToggleButton";

const options = {
  includeScore: false,
  threshold: 0.1,
  // Search in `ticker`, `name`, `keywords` values
  keys: getEnv("CRYPTO_ASSET_SEARCH_KEYS"),
  shouldSort: false,
};
function fuzzySearch(currencies: Currency[], searchValue: string): Currency[] {
  const fuse = new Fuse(currencies, options);
  return fuse.search(searchValue).map(res => res.item);
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
const HeaderContainer = styled.div`
  padding: 40px 0px 32px 0px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;

const SearchInputContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;

const optionsToggle = [
  {
    value: "allCurrency",
    label: <Trans i18nKey="drawers.selectCurrency.allCurrency" />,
  },
  {
    value: "account",
    label: <Trans i18nKey="drawers.selectCurrency.account" />,
  },
];

export type SelectAccountAndCurrencyDrawerProps = {
  onClose?: () => void;
  currencies: CryptoOrTokenCurrency[];
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  accounts$?: Observable<WalletAPIAccount[]>;
  filteringAccount?: boolean;
};

function SelectAccountAndCurrencyDrawer(props: SelectAccountAndCurrencyDrawerProps) {
  const { currencies, onAccountSelected, onClose, accounts$, filteringAccount } = props;
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>("");
  const [filterWithAccounts, setFilterWithAccounts] = useState<string>("allCurrency");
  const accounts = useSelector(flattenAccountsSelector);

  // sorting them by marketcap
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  // applying the toggle filter and fuzzy search if there is a valid searchValue
  const filteredCurrencies = useMemo(() => {
    let currenciesList = sortedCurrencies;
    if (filterWithAccounts === "account") {
      currenciesList = currenciesList.filter(currency =>
        accounts.some(account => {
          if ("currency" in account && account.currency.id === currency.id) return true;
          if ("token" in account && account.token.id === currency.id) return true;
          return false;
        }),
      );
    }
    if (searchValue.length >= 2) {
      return fuzzySearch(currenciesList, searchValue);
    }
    return currenciesList;
  }, [searchValue, sortedCurrencies, filterWithAccounts, accounts]);

  const handleCurrencySelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      setDrawer(
        SelectAccountDrawer,
        {
          accounts$,
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
    [onAccountSelected, props, onClose, accounts$],
  );
  if (currencies.length === 1) {
    return (
      <SelectAccountDrawer
        currency={currencies[0]}
        onAccountSelected={onAccountSelected}
        accounts$={accounts$}
      />
    );
  }
  return (
    <SelectAccountAndCurrencyDrawerContainer>
      <HeaderContainer>
        <Text
          ff="Inter|Medium"
          color="palette.text.shade100"
          fontSize="24px"
          style={{
            textTransform: "uppercase",
          }}
          data-testid="select-asset-drawer-title"
        >
          {t("drawers.selectCurrency.title")}
        </Text>
      </HeaderContainer>
      {filteringAccount ? (
        <ToggleContainer>
          <ToggleButton
            onChange={value => setFilterWithAccounts(value)}
            options={optionsToggle}
            value={filterWithAccounts}
          />
        </ToggleContainer>
      ) : null}
      <SelectorContent>
        <SearchInputContainer>
          <SearchInput
            data-testid="select-asset-drawer-search-input"
            value={searchValue}
            onChange={setSearchValue}
          />
        </SearchInputContainer>
        {/* @ts-expect-error compatibility issue betwenn CryptoOrTokenCurrency and Currency (which includes Fiat) and the SelectAccountDrawer components  */}
        <CurrencyList currencies={filteredCurrencies} onCurrencySelect={handleCurrencySelected} />
      </SelectorContent>
    </SelectAccountAndCurrencyDrawerContainer>
  );
}
const MemoizedSelectAccountAndCurrencyDrawer = memo(SelectAccountAndCurrencyDrawer);

export default MemoizedSelectAccountAndCurrencyDrawer;
