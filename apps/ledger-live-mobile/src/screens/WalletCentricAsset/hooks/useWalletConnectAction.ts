import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isWalletConnectSupported } from "@ledgerhq/live-common/walletConnect/index";
import { useNavigation } from "@react-navigation/core";
import { StackNavigationProp } from "@react-navigation/stack";
import { useCallback } from "react";
import { track } from "../../../analytics";
import { NavigatorName, ScreenName } from "~/const";

type Props = {
  currency: CryptoOrTokenCurrency;
  event: string;
};

export function useWalletConnectAction({ currency, event }: Props) {
  const navigation = useNavigation();

  const onNavigate = useCallback(
    (name: string, options?: object) => {
      (navigation as StackNavigationProp<{ [key: string]: object | undefined }>).navigate(
        name,
        options,
      );
    },
    [navigation],
  );
  const onWalletConnectPress = useCallback(() => {
    track(event, { currencyName: currency?.name });
    onNavigate(NavigatorName.WalletConnect, {
      screen: ScreenName.WalletConnectConnect,
    });
  }, [currency?.name, event, onNavigate]);

  const isWalletConnectActionDisplayable = isWalletConnectSupported(currency);

  return {
    onWalletConnectPress,
    isWalletConnectActionDisplayable,
  };
}
