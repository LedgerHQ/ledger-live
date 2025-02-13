import { Operation, AccountLike, Account, DailyOperations } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { accountsSelector } from "~/renderer/reducers/accounts";

import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  flattenAccounts,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import keyBy from "lodash/keyBy";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { BlockchainsType } from "@ledgerhq/live-nft/supported";
import { useHideSpamCollection } from "~/renderer/hooks/nfts/useHideSpamCollection";
import { useSpamTxFiltering } from "@ledgerhq/live-nft-react";
import logger from "~/renderer/logger";
import { usePagination } from "LLD/hooks/usePagination";

export type Props = {
  account?: AccountLike;
  parentAccount?: Account | null;
  accounts?: AccountLike[];
  withAccount?: boolean;
  withSubAccounts?: boolean;
  title?: string;
  filterOperation?: (b: Operation, a: AccountLike) => boolean;
};

const INITIAL_TO_SHOW = 20;

const defaultDailyOperations: DailyOperations = {
  sections: [],
  completed: false,
};

export function useOperationsList({
  account,
  parentAccount,
  accounts,
  withSubAccounts,
  filterOperation,
}: Props) {
  const spamFilteringTxFeature = useFeature("lldSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = Number(nftsFromSimplehashFeature?.params?.threshold) || 40;

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { nbToShow, loadMore } = usePagination(INITIAL_TO_SHOW, "FetchMoreOperations");

  const { hideSpamCollection } = useHideSpamCollection();

  const markNftAsSpam = useCallback(
    (collectionId: string, blockchain: BlockchainsType, spamScore: number) => {
      if (spamFilteringTxEnabled && spamScore > thresold) {
        hideSpamCollection(collectionId, blockchain);
      }
    },
    [hideSpamCollection, spamFilteringTxEnabled, thresold],
  );

  // FIXME: (legacy) not sure if it's relevant to use this source of accounts
  // TODO: fix this potential performance issue here , use indexed data structure
  const allAccounts = useSelector(accountsSelector);

  const all = flattenAccounts(accounts || []).concat(
    [account as AccountLike, parentAccount as AccountLike].filter(Boolean),
  );
  const accountsMap = keyBy(all, "id");

  const groupedOperations: DailyOperations = account
    ? groupAccountOperationsByDay(account, {
        count: nbToShow,
        withSubAccounts,
        filterOperation,
      })
    : accounts
      ? groupAccountsOperationsByDay(accounts, {
          count: nbToShow,
          withSubAccounts,
          filterOperation,
        })
      : defaultDailyOperations;

  const filteredData = useSpamTxFiltering(
    spamFilteringTxEnabled,
    accountsMap,
    groupedOperations,
    markNftAsSpam,
    thresold,
  );

  const handleClickOperation = (
    operation: Operation,
    account: AccountLike,
    parentAccount?: Account,
  ) => {
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id,
    });
  };

  // TODO: this function is legacy code and should be rewritten
  const getOperationProperties = (
    operation: Operation,
    account?: AccountLike,
    parentAccount?: Account | null,
  ) => {
    const innerAccount: AccountLike = account || accountsMap[operation.accountId];
    let innerParentAccount: Account | undefined = parentAccount || undefined;

    if (!innerAccount) {
      logger.warn(`no account found for operation ${operation.id}`);
      return null;
    }

    if (innerAccount.type !== "Account" && !innerParentAccount) {
      const pa =
        accountsMap[innerAccount.parentId] ||
        allAccounts?.find(a => a.id === innerAccount.parentId);

      if (!pa) {
        logger.warn(`no token account found for token operation ${operation.id}`);
        return null;
      } else {
        if (pa?.type === "Account") {
          innerParentAccount = pa;
        }
      }
    }

    const mainAccount = getMainAccount(innerAccount, innerParentAccount);

    return {
      accountOperation: innerAccount,
      parentAccountOperation: innerParentAccount,
      mainAccountOperation: mainAccount,
    };
  };

  return {
    nbToShow,
    handleClickOperation,
    fetchMoreOperations: loadMore,
    groupedOperations: filteredData,
    accountsMap,
    getOperationProperties,
  };
}
