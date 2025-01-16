import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/core";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { hasClosedNetworkBannerSelector } from "~/reducers/settings";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { setCloseNetworkBanner } from "~/actions/settings";
import { findAccountByCurrency } from "~/logic/deposit";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { AssetSelectionNavigationProps, SelectNetworkRouteParams } from "../../types";
import { CryptoWithAccounts } from "./types";
import { LoadingBasedGroupedCurrencies } from "@ledgerhq/live-common/deposit/type";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/deposit/index";

export default function useSelectNetworkViewModel({
  filterCurrencyIds,
  context,
  currency,
}: SelectNetworkRouteParams) {
  const navigation = useNavigation<AssetSelectionNavigationProps["navigation"]>();

  const { result, loadingStatus: providersLoadingStatus } = useGroupedCurrenciesByProvider(
    true,
  ) as LoadingBasedGroupedCurrencies;

  const { currenciesByProvider } = result;

  const provider = useMemo(
    () =>
      currenciesByProvider.find(elem =>
        elem.currenciesByNetwork.some(
          currencyByNetwork =>
            (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency,
        ),
      ),
    [currenciesByProvider, currency],
  );

  const networks = useMemo(
    () =>
      provider?.currenciesByNetwork.map(elem =>
        elem.type === "TokenCurrency" ? elem?.parentCurrency?.id : elem.id,
      ) || [],
    [provider?.currenciesByNetwork],
  );

  const dispatch = useDispatch();

  const hasClosedNetworkBanner = useSelector(hasClosedNetworkBannerSelector);
  const [displayBanner, setBanner] = useState(!hasClosedNetworkBanner);

  const { t } = useTranslation();

  const cryptoCurrencies = useMemo(() => {
    if (!networks) {
      return [];
    } else {
      const list = filterCurrencyIds
        ? networks.filter(network => filterCurrencyIds.includes(network))
        : networks;

      return list.map(net => {
        const selectedCurrency = findCryptoCurrencyById(net);
        if (selectedCurrency) return selectedCurrency;
        else return null;
      });
    }
  }, [filterCurrencyIds, networks]);

  const accounts = useSelector(flattenAccountsSelector);

  const sortedCryptoCurrencies = useCurrenciesByMarketcap(
    cryptoCurrencies.filter(e => !!e) as CryptoCurrency[],
  );

  const sortedCryptoCurrenciesWithAccounts: CryptoWithAccounts[] = useMemo(
    () =>
      sortedCryptoCurrencies
        .map(crypto => {
          const accs = findAccountByCurrency(accounts, crypto);
          return {
            crypto,
            accounts: accs,
          };
        })
        .sort((a, b) => b.accounts.length - a.accounts.length),
    [accounts, sortedCryptoCurrencies],
  );

  const navigateToDevice = useCallback(
    (currency: CryptoCurrency, createTokenAccount: boolean) => {
      navigation.navigate(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: currency,
          createTokenAccount,
          context,
        },
      });
    },
    [navigation, context],
  );

  const processNetworkSelection = useCallback(
    (selectedCurrency: CryptoCurrency | TokenCurrency) => {
      track("network_clicked", {
        network: selectedCurrency.name,
        page: "Choose a network",
      });

      const cryptoToSend = provider?.currenciesByNetwork.find(curByNetwork =>
        curByNetwork.type === "TokenCurrency"
          ? curByNetwork.parentCurrency.id === selectedCurrency.id
          : curByNetwork.id === selectedCurrency.id,
      );

      if (!cryptoToSend) return;
      const isAddAccountContext = context === "addAccounts";

      const accs = findAccountByCurrency(accounts, cryptoToSend);

      if (accs.length > 0 && !isAddAccountContext) {
        // if we found one or more accounts of the given currency we go to select account
        navigation.navigate(NavigatorName.AddAccounts, {
          screen: ScreenName.SelectAccounts,
          params: {
            currency: cryptoToSend,
            context,
          },
        });
      } else if (cryptoToSend.type === "TokenCurrency") {
        if (isAddAccountContext) {
          navigateToDevice(cryptoToSend.parentCurrency, true);
        } else {
          // cases for token currencies
          const parentAccounts = findAccountByCurrency(accounts, cryptoToSend.parentCurrency);

          if (parentAccounts.length > 0) {
            // if we found one or more accounts of the parent currency we select account

            navigation.navigate(NavigatorName.AddAccounts, {
              screen: ScreenName.SelectAccounts,
              params: {
                currency: cryptoToSend,
                createTokenAccount: true,
                context,
              },
            });
          } else {
            // if we didn't find any account of the parent currency we add and create one
            navigateToDevice(cryptoToSend.parentCurrency, true);
          }
        }
      } else {
        // else we create a currency account
        navigateToDevice(cryptoToSend, false);
      }
    },
    [accounts, navigation, provider, context, navigateToDevice],
  );

  const hideBanner = useCallback(() => {
    track("button_clicked", {
      button: "Close network article",
      page: "Choose a network",
    });
    dispatch(setCloseNetworkBanner(true));
    setBanner(false);
  }, [dispatch]);

  const clickLearn = () => {
    track("button_clicked", {
      button: "Choose a network article",
      type: "card",
      page: "Choose a network",
    });
    Linking.openURL(urls.chooseNetwork);
  };

  const { titleText, subtitleText, titleTestId, subTitleTestId, listTestId } = useMemo((): Record<
    string,
    string
  > => {
    switch (context) {
      case "receiveFunds":
        return {
          titleText: t("selectNetwork.swap.title"),
          titleTestId: "receive-header-step2-title",
          subtitleText: t("selectNetwork.swap.subtitle"),
          subTitleTestId: "transfer.receive.selectNetwork.subtitle",
          listTestId: "receive-header-step2-networks",
        };
      case "addAccounts":
        return {
          titleText: t("assetSelection.selectNetwork.title"),
          titleTestId: "addAccounts-header-step2-title",
          listTestId: "addAccounts-header-step2-networks",
        };
      default:
        return {};
    }
  }, [context, t]);

  return {
    hideBanner,
    clickLearn,
    sortedCryptoCurrenciesWithAccounts,
    onPressItem: processNetworkSelection,
    displayBanner,
    titleText,
    subtitleText,
    titleTestId,
    subTitleTestId,
    listTestId,
    providersLoadingStatus,
  };
}
