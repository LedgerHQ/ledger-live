import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountLike, DistributionItem, Operation } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { lastSeenOperationDateSelector } from "~/reducers/history";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";

export const MAX_PREVIEW_OPERATIONS = 3;

export function useTransactionsViewModel(
  currency?: CryptoOrTokenCurrency,
  distributionItem?: DistributionItem,
) {
  const navigation = useNavigation<BaseNavigation>();

  const allAccounts = useSelector(accountsSelector);

  // Falls back to a native-currency lookup when the asset distribution is not
  // yet available (e.g. async load, or native account with zero balance and
  // past operations). Token currencies still require an explicit
  // `distributionItem` to avoid leaking sibling-token operations.
  const allowedIds = useMemo(() => {
    if (distributionItem) {
      return new Set(distributionItem.accounts.map(a => a.id));
    }
    if (currency?.type === "CryptoCurrency") {
      return new Set(allAccounts.filter(a => a.currency.id === currency.id).map(a => a.id));
    }
    return new Set<string>();
  }, [distributionItem, currency, allAccounts]);

  const rootAccounts: Account[] = useMemo(() => {
    if (allowedIds.size === 0) return [];
    return allAccounts.filter(root => flattenAccounts([root]).some(a => allowedIds.has(a.id)));
  }, [allAccounts, allowedIds]);

  const flattenedRootAccounts: AccountLike[] = useMemo(
    () => flattenAccounts(rootAccounts),
    [rootAccounts],
  );

  const scopedFilter = useCallback(
    (_op: Operation, account: AccountLike) => allowedIds.has(account.id),
    [allowedIds],
  );

  const { sections } = useOperationsV1(rootAccounts, MAX_PREVIEW_OPERATIONS, {
    filterOperation: scopedFilter,
  });

  const operations: Operation[] = useMemo(
    () => sections.flatMap(section => section.data).slice(0, MAX_PREVIEW_OPERATIONS),
    [sections],
  );

  const lastSeenDate = useSelector(lastSeenOperationDateSelector);
  const lastSeenTs = useMemo(() => parseLastSeenMs(lastSeenDate), [lastSeenDate]);

  const accountByAddress = useMemo(() => {
    const map = new Map<string, AccountLike>();
    for (const account of rootAccounts) {
      const { freshAddress } = account;
      if (freshAddress) {
        const currId = getAccountCurrency(account).id;
        map.set(`${currId}:${freshAddress}`, account);
      }
    }
    return map;
  }, [rootAccounts]);

  const findAccount = useCallback(
    (accountId: string): { account: AccountLike; parentAccount: Account | undefined } | null => {
      const account = flattenedRootAccounts.find(a => a.id === accountId);
      if (!account) return null;
      const parentAccount: Account | undefined =
        account.type === "Account" ? undefined : rootAccounts.find(a => a.id === account.parentId);
      return { account, parentAccount };
    },
    [flattenedRootAccounts, rootAccounts],
  );

  const onHeaderPress = useCallback(() => {
    track("button_clicked", {
      button: "Transactions",
      currency: currency?.id,
      page: "Asset Detail",
    });
    navigation.navigate(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { accountIds: Array.from(allowedIds) },
    });
  }, [navigation, currency?.id, allowedIds]);

  return {
    operations,
    accountByAddress,
    lastSeenTs,
    findAccount,
    onHeaderPress,
    hasData: operations.length > 0,
  };
}
