import { useCallback, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";
import {
  CurrentAccountHistDB,
  useDAppManifestCurrencyIds,
} from "@ledgerhq/live-common/wallet-api/react";
import { useDappCurrentAccount } from "@ledgerhq/live-common/wallet-api/useDappLogic";
import { useCurrenciesByMarketcap } from "@ledgerhq/live-common/currencies/hooks";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike } from "@ledgerhq/types-live";
import { AppProps } from "LLM/features/Web3Hub/types";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { NavigatorName, ScreenName } from "~/const";

export type Params = {
  manifest: AppManifest;
  currentAccountHistDb: CurrentAccountHistDB;
  onSelectAccount: () => void;
  onClose: () => void;
};

export default function useSelectAccountModalViewModel({
  manifest,
  currentAccountHistDb,
  onSelectAccount,
  onClose,
}: Params) {
  const [selectedCurrency, setSelectedCurrency] = useState<CryptoCurrency | undefined>();

  const currencyIds = useDAppManifestCurrencyIds(manifest);
  const currencies = useMemo(() => {
    return currencyIds.reduce<CryptoCurrency[]>((acc, id) => {
      const c = findCryptoCurrencyById(id);
      if (c) acc.push(c);
      return acc;
    }, []);
  }, [currencyIds]);
  const sortedCurrencies = useCurrenciesByMarketcap(currencies);

  const { setCurrentAccountHist, setCurrentAccount } = useDappCurrentAccount(currentAccountHistDb);

  const onPressCurrencyItem = useCallback((currency: CryptoCurrency) => {
    setSelectedCurrency(currency);
  }, []);

  const resetSelectedCurrency = useCallback(() => {
    setSelectedCurrency(undefined);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetSelectedCurrency();
  }, [onClose, resetSelectedCurrency]);

  const setSelectedAccount = useCallback(
    (account: AccountLike) => {
      setCurrentAccountHist(manifest.id, account);
      setCurrentAccount(account);
      onClose();
    },
    [manifest.id, onClose, setCurrentAccount, setCurrentAccountHist],
  );

  const navigation = useNavigation<AppProps["navigation"]>();
  const onAddAccount = useCallback(() => {
    navigation.navigate(NavigatorName.RequestAccount, {
      screen: NavigatorName.RequestAccountsAddAccounts,
      params: {
        screen: ScreenName.AddAccountsSelectDevice,
        params: {
          currency: selectedCurrency,
          onSuccess: ({ selected }) => {
            navigation.goBack();
            const account = selected[0];
            if (account) {
              if (selected.length === 1) {
                setSelectedAccount(account);
              } else {
                setSelectedCurrency(account.currency);
                onSelectAccount();
              }
            }
          },
        },
      },
    });
  }, [navigation, onSelectAccount, selectedCurrency, setSelectedAccount]);

  return {
    selectedCurrency,
    sortedCurrencies,
    resetSelectedCurrency,
    onPressCurrencyItem,
    handleClose,
    setSelectedAccount,
    onAddAccount,
  };
}
