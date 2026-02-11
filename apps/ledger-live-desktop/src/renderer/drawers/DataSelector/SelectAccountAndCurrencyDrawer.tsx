import React, { useMemo, useState, memo, useCallback } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@ledgerhq/react-ui";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "../Provider";
import Text from "~/renderer/components/Text";
import { CurrencyList } from "./CurrencyList";
import SelectAccountDrawer from "./SelectAccountDrawer";
import { track } from "~/renderer/analytics/segment";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useAcceptedCurrency } from "@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency";
import BigSpinner from "~/renderer/components/BigSpinner";
import { useIdsByMarketCap } from "@ledgerhq/live-countervalues-react";

const TRACK_PAGE_NAME = "Asset/Network selection";

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
const HeaderContainer = styled.div`
  padding: 40px 0px 32px 0px;
  flex: 0 1 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const Loader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export type SelectAccountAndCurrencyDrawerProps = {
  onClose?: () => void;
  currencyIds?: string[];
  useCase?: string;
  onAccountSelected: (account: AccountLike, parentAccount?: Account) => void;
  flow?: string;
  source?: string;
};
const SearchInputContainer = styled.div`
  padding: 0px 40px 16px 40px;
  flex: 0 1 auto;
`;

function SelectAccountAndCurrencyDrawer(props: SelectAccountAndCurrencyDrawerProps) {
  const { currencyIds, useCase, onAccountSelected, onClose, flow, source } = props;
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>("");

  const isAcceptedCurrency = useAcceptedCurrency();
  const devMode = useEnv("MANAGER_DEV_MODE");

  const { data, isLoading, loadNext } = useAssetsData({
    search: searchValue,
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    areCurrenciesFiltered: currencyIds && currencyIds.length > 0,
    isStaging: false,
    includeTestNetworks: devMode,
    useCase,
  });

  // Pagination is a bit strange with this because we order by market cap
  // but it works fine and keeps the old/expected order as much as possible
  const ids = useIdsByMarketCap();

  // TODO: Make sure we don't have delisted tokens here too
  const assetsToDisplay = useMemo(() => {
    if (!data) return [];

    const orderedSet = ids.reduce<Set<CryptoOrTokenCurrency>>((acc, id) => {
      const currency = data.cryptoOrTokenCurrencies[id];
      if (currency && isAcceptedCurrency(currency)) {
        acc.add(currency);
      }
      return acc;
    }, new Set());

    data.currenciesOrder.metaCurrencyIds
      .flatMap(metaCurrencyId => {
        const assetsIds = data.cryptoAssets[metaCurrencyId]?.assetsIds;
        return assetsIds ? Object.values(assetsIds) : [];
      })
      .forEach(currencyId => {
        const currency = data.cryptoOrTokenCurrencies[currencyId];
        if (currency && isAcceptedCurrency(currency)) {
          orderedSet.add(currency);
        }
      });

    return Array.from(orderedSet);
  }, [data, ids, isAcceptedCurrency]);

  const handleCurrencySelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      const network =
        currency.type === "TokenCurrency" ? currency.parentCurrency?.name : currency.name;

      track("asset_network_clicked ", {
        asset: currency.ticker,
        network,
        flow,
        source,
        page: TRACK_PAGE_NAME,
      });
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
    [flow, source, onAccountSelected, onClose, props],
  );
  if (currencyIds && currencyIds.length === 1) {
    return (
      <SelectAccountDrawer currency={assetsToDisplay[0]} onAccountSelected={onAccountSelected} />
    );
  }
  return (
    <SelectAccountAndCurrencyDrawerContainer>
      <HeaderContainer>
        <Text
          ff="Inter|Medium"
          color="neutral.c100"
          fontSize="24px"
          textTransform="uppercase"
          data-testid="select-asset-drawer-title"
        >
          {t("drawers.selectCurrency.title")}
        </Text>
      </HeaderContainer>
      <SearchInputContainer>
        <SearchInput
          data-testid="select-asset-drawer-search-input"
          value={searchValue}
          onChange={setSearchValue}
        />
      </SearchInputContainer>
      {isLoading ? (
        <Loader>
          <BigSpinner size={50} />
        </Loader>
      ) : (
        <CurrencyList
          currencies={assetsToDisplay}
          onCurrencySelect={handleCurrencySelected}
          onVisibleItemsScrollEnd={loadNext}
          hasNextPage={!!loadNext}
        />
      )}
    </SelectAccountAndCurrencyDrawerContainer>
  );
}
const MemoizedSelectAccountAndCurrencyDrawer = memo(SelectAccountAndCurrencyDrawer);

export default MemoizedSelectAccountAndCurrencyDrawer;
