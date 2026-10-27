import { track } from "@shared/analytics";
import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { flattenAccounts } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { lastSeenOperationDateSelector } from "~/reducers/history";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { parseLastSeenMs } from "../../utils/unreadOperations";
import { useIsPendingOperation } from "../../screens/OperationsList/hooks/useOperationsSections";

export const MAX_PREVIEW_OPERATIONS = 3;

export type RecentOperationsParams = Readonly<{
  accountIds: readonly string[];
  trackingPage: string;
  trackingCurrencyId?: string;
}>;

type ResolvedAccount = Readonly<{ account: AccountLike; parentAccount: Account | undefined }>;

export type RecentOperationsViewModel = Readonly<{
  operations: Operation[];
  pendingOperationIds: ReadonlySet<string>;
  accountByAddress: Map<string, AccountLike>;
  lastSeenTs: number | null;
  findAccount: (accountId: string) => ResolvedAccount | null;
  onHeaderPress: () => void;
  hasData: boolean;
}>;

function toPendingOnlyAccounts(
  accounts: AccountLike[],
  isPendingOperation: (op: Operation, account: AccountLike) => boolean,
): AccountLike[] {
  return accounts.flatMap(account => {
    const operations = account.operations.filter(op => isPendingOperation(op, account));
    const stableHashes = new Set(account.operations.map(op => op.hash));
    const pendingOperations = account.pendingOperations.filter(op => !stableHashes.has(op.hash));
    if (operations.length === 0 && pendingOperations.length === 0) return [];

    return account.type === "Account"
      ? [{ ...account, operations, pendingOperations, subAccounts: [] }]
      : [{ ...account, operations, pendingOperations }];
  });
}

function mergePendingFirst(pending: Operation[], recent: Operation[]): Operation[] {
  const pendingIds = new Set(pending.map(op => op.id));
  const confirmed = recent.filter(op => !pendingIds.has(op.id));
  return [...pending, ...confirmed].slice(0, MAX_PREVIEW_OPERATIONS);
}

export function useRecentOperationsViewModel({
  accountIds,
  trackingPage,
  trackingCurrencyId,
}: RecentOperationsParams): RecentOperationsViewModel {
  const navigation = useNavigation<BaseNavigation>();
  const allAccounts = useSelector(accountsSelector);

  const accountIdsKey = accountIds.join(",");
  const allowedIds = useMemo(
    () => new Set(accountIdsKey ? accountIdsKey.split(",") : []),
    [accountIdsKey],
  );

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

  const isPendingOperation = useIsPendingOperation();
  const pendingOnlyAccounts = useMemo(
    () =>
      toPendingOnlyAccounts(
        flattenedRootAccounts.filter(account => allowedIds.has(account.id)),
        isPendingOperation,
      ),
    [flattenedRootAccounts, allowedIds, isPendingOperation],
  );

  const { sections: pendingSections } = useOperationsV1(
    pendingOnlyAccounts,
    MAX_PREVIEW_OPERATIONS,
  );
  const { sections: recentSections } = useOperationsV1(rootAccounts, MAX_PREVIEW_OPERATIONS, {
    filterOperation: scopedFilter,
  });

  const pendingOperations = useMemo(
    () => pendingSections.flatMap(section => section.data),
    [pendingSections],
  );

  const operations: Operation[] = useMemo(
    () =>
      mergePendingFirst(
        pendingOperations,
        recentSections.flatMap(section => section.data),
      ),
    [pendingOperations, recentSections],
  );

  const pendingOperationIds = useMemo(
    () => new Set(pendingOperations.map(op => op.id)),
    [pendingOperations],
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
    (accountId: string): ResolvedAccount | null => {
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
      currency: trackingCurrencyId,
      page: trackingPage,
    });
    navigation.navigate(NavigatorName.OperationsHistory, {
      screen: ScreenName.OperationsList,
      params: { accountIds: Array.from(allowedIds) },
    });
  }, [navigation, trackingCurrencyId, trackingPage, allowedIds]);

  return {
    operations,
    pendingOperationIds,
    accountByAddress,
    lastSeenTs,
    findAccount,
    onHeaderPress,
    hasData: operations.length > 0,
  };
}
