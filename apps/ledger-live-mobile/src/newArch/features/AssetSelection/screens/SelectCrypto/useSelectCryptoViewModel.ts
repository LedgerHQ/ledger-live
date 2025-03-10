import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import debounce from "lodash/debounce";
import { useNavigation } from "@react-navigation/core";

import { findCryptoCurrencyByKeyword } from "@ledgerhq/live-common/currencies/index";

import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetSelectionNavigationProps, CommonParams } from "../../types";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import { AnalyticMetadata } from "LLM/hooks/useAnalytics/types";
import { AnalyticPages } from "LLM/hooks/useAnalytics/enums";

type SelectCryptoViewModelProps = Pick<CommonParams, "context"> & {
  filterCurrencyIds?: string[];
  paramsCurrency?: string;
  sourceScreenName?: string;
  analyticsMetadata: AnalyticMetadata;
  path?: string;
};

export default function useSelectCryptoViewModel({
  context,
  filterCurrencyIds,
  paramsCurrency,
  analyticsMetadata,
  path,
}: SelectCryptoViewModelProps) {
  const { t } = useTranslation();
  const filterCurrencyIdsSet = useMemo(
    () => (filterCurrencyIds ? new Set(filterCurrencyIds) : null),
    [filterCurrencyIds],
  );
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;
  const { currenciesByProvider, sortedCryptoCurrencies } = result;

  console.log(">>> currenciesByProvider", currenciesByProvider);

  const onPressItem = useCallback(
    (curr: CryptoCurrency | TokenCurrency) => {
      const clickMetadata = analyticsMetadata.AddAccountsSelectCrypto?.onAssetClick;
      if (clickMetadata)
        track(clickMetadata?.eventName, {
          asset: curr.name,
          ...clickMetadata.payload,
        });

      const provider = currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork => (currencyByNetwork as CryptoCurrency | TokenCurrency).id === curr.id,
        ),
      );

      // If the selected currency exists on multiple networks we redirect to the SelectNetwork screen
      if (provider && provider?.currenciesByNetwork.length > 1) {
        navigation.navigate(ScreenName.SelectNetwork, {
          context,
          currency: curr.id,
          ...(context === AddAccountContexts.AddAccounts && { filterCurrencyIds }),
          sourceScreenName: AnalyticPages.AddAccountSelectAsset,
        });
        return;
      }

      const isToken = curr.type === "TokenCurrency";
      const currency = isToken ? curr.parentCurrency : curr;
      const isAddAccountContext =
        context === AddAccountContexts.AddAccounts || path?.includes("add-account");

      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency,
          createTokenAccount: isToken || undefined,
          context: isAddAccountContext ? AddAccountContexts.AddAccounts : context,
        },
      });
    },
    [
      currenciesByProvider,
      navigation,
      filterCurrencyIds,
      context,
      analyticsMetadata.AddAccountsSelectCrypto?.onAssetClick,
      path,
    ],
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
    const searchMetadata = analyticsMetadata.AddAccountsSelectCrypto?.onAssetSearch;
    if (searchMetadata)
      track(searchMetadata?.eventName, {
        asset: newQuery,
        ...searchMetadata.payload,
      });
  }, 1500);

  const list = useMemo(
    () =>
      filterCurrencyIdsSet
        ? sortedCryptoCurrencies.filter(crypto => filterCurrencyIdsSet.has(crypto.id))
        : sortedCryptoCurrencies,
    [filterCurrencyIdsSet, sortedCryptoCurrencies],
  );
  const { titleText, titleTestId } = useMemo(() => {
    switch (context) {
      case AddAccountContexts.AddAccounts:
        return {
          titleText: t("assetSelection.selectCrypto.title"),
          titleTestId: "select-crypto-header-step1-title",
        };
      case AddAccountContexts.ReceiveFunds:
        return {
          titleText: t("transfer.receive.selectCrypto.title"),
          titleTestId: "receive-header-step1-title",
        };
      default:
        return {};
    }
  }, [context, t]);

  return {
    titleText,
    titleTestId,
    list,
    debounceTrackOnSearchChange,
    onPressItem,
    providersLoadingStatus,
  };
}
