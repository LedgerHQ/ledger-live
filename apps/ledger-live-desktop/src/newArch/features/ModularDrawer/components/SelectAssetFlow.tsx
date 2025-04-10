import React, { useMemo, useState, memo, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/react-ui";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import Fuse from "fuse.js";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import Text from "~/renderer/components/Text";
import { CurrencyList } from "~/renderer/drawers/DataSelector/CurrencyList";
import { listAndFilterCurrencies } from "@ledgerhq/live-common/platform/helpers";
import { getEnv } from "@ledgerhq/live-env";

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

export type SelectAccountAndCurrencyDrawerProps = {
  assetIds?: string[];
  includeTokens?: boolean;
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
};

function SelectAssetFlow(props: SelectAccountAndCurrencyDrawerProps) {
  const { onAssetSelected, assetIds, includeTokens } = props;

  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>("");

  const currencies = listAndFilterCurrencies({
    currencies: assetIds,
    includeTokens,
  });

  // sorting them by marketcap
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  // performing fuzzy search if there is a valid searchValue
  const filteredCurrencies = useMemo(() => {
    if (searchValue.length < 2) {
      return sortedCurrencies;
    }

    return fuzzySearch(sortedCurrencies, searchValue);
  }, [searchValue, sortedCurrencies]);

  const handleCurrencySelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      onAssetSelected(currency);
    },
    [onAssetSelected],
  );

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
const MemoizedSelectAssetFlow = memo(SelectAssetFlow);

export default MemoizedSelectAssetFlow;

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

const SearchInputContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;
