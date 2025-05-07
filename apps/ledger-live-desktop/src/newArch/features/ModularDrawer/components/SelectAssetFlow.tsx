import React, { useState, memo, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import Text from "~/renderer/components/Text";
import { SelectNetwork } from "./SelectNetwork";
import { SearchItem } from "./Search";

export type SelectAccountAndCurrencyDrawerProps = {
  onAssetSelected: (asset: CryptoOrTokenCurrency) => void;
  currencies: CryptoOrTokenCurrency[];
};

function SelectAssetFlow(props: SelectAccountAndCurrencyDrawerProps) {
  const { t } = useTranslation();
  const { onAssetSelected, currencies } = props;

  // sorting them by marketcap
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  const [itemsToDisplay, setItemsToDisplay] = useState<CryptoOrTokenCurrency[]>(sortedCurrencies);

  const handleCurrencySelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      onAssetSelected(currency);
    },
    [onAssetSelected],
  );

  // TODO : this is a temporary to handle the case where we have only one asset and one currency
  if (currencies.length === 1) {
    const currency = currencies[0];
    onAssetSelected(currency);
    return null;
  }

  return (
    <SelectAccountAndCurrencyDrawerContainer>
      <HeaderContainer>
        <Text
          ff="Inter|Medium"
          color="palette.text.shade100"
          fontSize="24px"
          data-testid="select-asset-drawer-title"
        >
          {t("drawers.selectCurrency.title")}
        </Text>
      </HeaderContainer>
      <SelectorContent>
        <SearchInputContainer>
          <SearchItem
            flow="Modular Asset Flow"
            source="Accounts"
            items={sortedCurrencies}
            setItemsToDisplay={setItemsToDisplay}
          />
        </SearchInputContainer>
        <SelectNetwork
          networks={itemsToDisplay}
          onNetworkSelected={handleCurrencySelected}
          flow="Modular Asset Flow"
          source="Accounts"
        />
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
  height: 100%;
`;

const SelectorContent = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  margin: 0px 16px 0px;
  height: 100%;
`;
const HeaderContainer = styled.div`
  padding: 54px 0px 16px 24px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
`;

const SearchInputContainer = styled.div`
  padding: 0px 0px 16px 0px;
  flex: 0 1 auto;
`;
