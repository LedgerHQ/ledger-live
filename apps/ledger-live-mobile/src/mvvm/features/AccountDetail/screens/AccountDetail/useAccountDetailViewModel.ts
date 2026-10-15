import { useCallback, useEffect, useMemo } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { useMaybeAccountName } from "~/reducers/wallet";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import type { AccountDetailNavigatorParamsList } from "../../types";

export type AccountDetailHeader = Readonly<{
  title: string;
  address: string;
  ledgerId: string;
  ticker: string;
}>;

export type AccountDetailViewModel = Readonly<{
  account: Account | undefined;
  header: AccountDetailHeader | undefined;
  onOpenSettings: () => void;
}>;

type AccountDetailRoute = RouteProp<AccountDetailNavigatorParamsList, ScreenName.AccountDetail>;
type AccountDetailNavigation = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList>
>;

export function useAccountDetailViewModel(): AccountDetailViewModel {
  const route = useRoute<AccountDetailRoute>();
  const navigation = useNavigation<AccountDetailNavigation>();
  const { account } = useAccountScreen(route);
  const mainAccount = account?.type === "Account" ? account : undefined;

  useEffect(() => {
    if (mainAccount) return;
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: { screen: NavigatorName.Portfolio, params: { screen: ScreenName.Portfolio } },
    });
  }, [mainAccount, navigation]);

  const accountName = useMaybeAccountName(mainAccount);
  const header = useMemo(
    () =>
      mainAccount && accountName
        ? {
            title: accountName,
            address: formatAddress(mainAccount.freshAddress, { prefixLength: 4, suffixLength: 4 }),
            ledgerId: mainAccount.currency.id,
            ticker: mainAccount.currency.ticker,
          }
        : undefined,
    [mainAccount, accountName],
  );

  const onOpenSettings = useCallback(() => undefined, []);

  return { account: mainAccount, header, onOpenSettings };
}
