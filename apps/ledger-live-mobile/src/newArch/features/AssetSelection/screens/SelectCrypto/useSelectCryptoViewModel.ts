import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import debounce from "lodash/debounce";
import { useNavigation } from "@react-navigation/core";

import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";

import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { findAccountByCurrency } from "~/logic/deposit";

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetSelectionNavigationProps } from "../../types";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";

export default function useSelectCryptoViewModel({
  context,
  filterCurrencyIds,
  paramsCurrency,
}: {
  context?: "addAccounts" | "receiveFunds";
  filterCurrencyIds: string[] | undefined;
  paramsCurrency: string | undefined;
}) {
  const { t } = useTranslation();
  const filterCurrencyIdsSet = useMemo(
    () => (filterCurrencyIds ? new Set(filterCurrencyIds) : null),
    [filterCurrencyIds],
  );

  const accounts = useSelector(flattenAccountsSelector);
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;
  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  const onPressItem = useCallback(
    (curr: CryptoCurrency | TokenCurrency) => {
      track("asset_clicked", {
        asset: curr.name,
        page: "Choose a crypto to secure",
      });

      const provider = currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork => (currencyByNetwork as CryptoCurrency | TokenCurrency).id === curr.id,
        ),
      );
      // If the selected currency exists on multiple networks we redirect to the SelectNetwork screen
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(ScreenName.SelectNetwork, {
          provider,
          filterCurrencyIds,
        });
        return;
      }

      const isToken = curr.type === "TokenCurrency";
      const currency = isToken ? curr.parentCurrency : curr;
      const currencyAccounts = findAccountByCurrency(accounts, currency);

      if (currencyAccounts.length > 0) {
        // If we found one or more accounts of the currency then we select account
        navigation.navigate(NavigatorName.AddAccounts, {
          screen: ScreenName.SelectAccounts,
          params: {
            currency,
          },
        });
      } else {
        // If we didn't find any account of the parent currency then we add one
        navigation.navigate(NavigatorName.DeviceSelection, {
          screen: ScreenName.SelectDevice,
          params: {
            currency,
            createTokenAccount: isToken || undefined,
            context,
          },
        });
      }
    },
    [currenciesByProvider, accounts, navigation, filterCurrencyIds, context],
  );

  useEffect(() => {
    if (paramsCurrency) {
      const selectedCurrency = findCryptoCurrencyByKeyword(paramsCurrency.toUpperCase());
      if (selectedCurrency && providersLoadingStatus === "success") {
        onPressItem(selectedCurrency);
      }
    }
  }, [onPressItem, paramsCurrency, providersLoadingStatus]);

  const debounceTrackOnSearchChange = debounce((newQuery: string) => {
    track("asset_searched", { page: "Choose a crypto to secure", asset: newQuery });
  }, 1500);

  const list = useMemo(
    () =>
      filterCurrencyIdsSet
        ? sortedCryptoCurrencies.filter(crypto => filterCurrencyIdsSet.has(crypto.id))
        : sortedCryptoCurrencies,
    [filterCurrencyIdsSet, sortedCryptoCurrencies],
  );
  const titleText = useMemo(() => {
    switch (context) {
      case "addAccounts":
        return t("assetSelection.selectCrypto.title");
      case "receiveFunds":
        return t("transfer.receive.selectCrypto.title");
      default:
        return "";
    }
  }, [context, t]);

  return {
    titleText,
    list,
    debounceTrackOnSearchChange,
    onPressItem,
    providersLoadingStatus,
  };
}
