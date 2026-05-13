import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { lastSeenOperationDateSelector } from "~/reducers/history";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useAccountsByCryptoCurrency } from "LLM/hooks/useAccountsByCryptoCurrency";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";

export const MAX_PREVIEW_OPERATIONS = 3;

export function useTransactionsViewModel(currency: CryptoOrTokenCurrency | undefined) {
  const navigation = useNavigation<BaseNavigation>();

  const accountTuples = useAccountsByCryptoCurrency(currency);

  const accounts: Account[] = useMemo(
    () => accountTuples.map(tuple => tuple.account as Account),
    [accountTuples],
  );

  const allAccounts: AccountLike[] = useMemo(() => flattenAccounts(accounts), [accounts]);

  const { sections } = useOperationsV1(accounts, MAX_PREVIEW_OPERATIONS);

  const operations: Operation[] = useMemo(
    () => sections.flatMap(section => section.data).slice(0, MAX_PREVIEW_OPERATIONS),
    [sections],
  );

  const lastSeenDate = useSelector(lastSeenOperationDateSelector);
  const lastSeenTs = useMemo(() => parseLastSeenMs(lastSeenDate), [lastSeenDate]);

  const accountByAddress = useMemo(() => {
    const map = new Map<string, AccountLike>();
    for (const account of accounts) {
      const { freshAddress } = account;
      if (freshAddress) {
        const currId = getAccountCurrency(account).id;
        map.set(`${currId}:${freshAddress}`, account);
      }
    }
    return map;
  }, [accounts]);

  const findAccount = useCallback(
    (accountId: string): { account: AccountLike; parentAccount: Account | undefined } | null => {
      const account = allAccounts.find(a => a.id === accountId);
      if (!account) return null;
      const parentAccount: Account | undefined =
        account.type === "Account" ? undefined : accounts.find(a => a.id === account.parentId);
      return { account, parentAccount };
    },
    [allAccounts, accounts],
  );

  const onHeaderPress = useCallback(() => {
    track("button_clicked", {
      button: "transactions_header",
      currency: currency?.id,
      page: "Asset Detail",
    });
    navigation.navigate(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { currencyId: currency?.id },
    });
  }, [navigation, currency?.id]);

  return {
    operations,
    accountByAddress,
    lastSeenTs,
    findAccount,
    onHeaderPress,
  };
}
