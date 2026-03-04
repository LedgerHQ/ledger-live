import { useMemo } from "react";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { DefaultAccountSwapParamList } from "~/screens/Swap/types";
import { NavigationParamsType } from "~/components/FabActions";

type UseOpenSwapProps = {
  currency?: CryptoOrTokenCurrency;
  sourceScreenName: string;
  defaultAccount?: AccountLike;
  defaultParentAccount?: Account;
};

export function useOpenSwap({
  currency,
  sourceScreenName,
  defaultAccount,
  defaultParentAccount,
}: UseOpenSwapProps): NavigationParamsType {
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");

  return useMemo(() => {
    const swapParams: DefaultAccountSwapParamList = {
      defaultCurrency: currency,
      fromPath: sourceScreenName,
      ...(defaultAccount ? { defaultAccount } : {}),
      ...(defaultParentAccount ? { defaultParentAccount } : {}),
      ...(!defaultAccount && currency && isTokenCurrency(currency) ? { toTokenId: currency.id } : {}),
    };

    return shouldDisplayWallet40MainNav
      ? ([
          NavigatorName.Main,
          {
            screen: NavigatorName.Swap,
            params: {
              screen: ScreenName.SwapTab,
              params: swapParams,
            },
          },
        ] as const)
      : ([
          NavigatorName.Swap,
          {
            screen: ScreenName.SwapTab,
            params: swapParams,
          },
        ] as const);
  }, [currency, defaultAccount, defaultParentAccount, shouldDisplayWallet40MainNav, sourceScreenName]);
}
