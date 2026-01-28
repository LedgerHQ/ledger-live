import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "~/context/hooks";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isAccount } from "@ledgerhq/coin-framework/account/helpers";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { getAvailableAccountsById } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { NavigatorName, ScreenName } from "~/const";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
};

export function useOpenSwap({ currency, sourceScreenName }: UseOpenSwapProps) {
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const shallowAccounts = useSelector(shallowAccountsSelector);

  const currencyId = currency?.id;

  const defaultAccount = currencyId
    ? getAvailableAccountsById(currencyId, flattenedAccounts).find(Boolean)
    : undefined;

  const swapParams: DefaultAccountSwapParamList = useMemo(() => {
    const baseParams = {
      defaultCurrency: currency,
      fromPath: sourceScreenName,
    };

    if (!defaultAccount) {
      return {
        ...baseParams,
        ...(currency && isTokenCurrency(currency) && { toTokenId: currency.id }),
      };
    }

    const parentId = "parentId" in defaultAccount ? defaultAccount.parentId : undefined;
    const foundParent = parentId ? shallowAccounts.find(acc => acc.id === parentId) : undefined;
    const parentAcc = foundParent && isAccount(foundParent) ? foundParent : undefined;

    return {
      ...baseParams,
      defaultAccount: isAccount(defaultAccount) ? defaultAccount : undefined,
      defaultParentAccount: parentAcc,
    };
  }, [currency, sourceScreenName, defaultAccount, shallowAccounts]);

  const handleOpenSwap = useCallback(() => {
    navigation.navigate(NavigatorName.Swap, {
      screen: ScreenName.SwapTab,
      params: swapParams,
    });
  }, [navigation, swapParams]);

  return { handleOpenSwap };
}
