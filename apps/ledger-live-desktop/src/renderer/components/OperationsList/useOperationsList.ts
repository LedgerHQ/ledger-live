import { Operation, AccountLike, Account } from "@ledgerhq/types-live";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { track } from "~/renderer/analytics/segment";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { accountsSelector } from "~/renderer/reducers/accounts";

import {
  groupAccountOperationsByDay,
  groupAccountsOperationsByDay,
  flattenAccounts,
} from "@ledgerhq/live-common/account/index";
import keyBy from "lodash/keyBy";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { BlockchainsType } from "@ledgerhq/live-nft/supported";
import { useHideSpamCollection } from "~/renderer/hooks/nfts/useHideSpamCollection";
import { useSpamTxFiltering } from "@ledgerhq/live-nft-react";

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

function usePagination(initialCount: number) {
  const [nbToShow, setNbToShow] = useState(initialCount);

  const loadMore = () => {
    track("FetchMoreOperations");
    setNbToShow(prev => prev + initialCount);
  };

  return { nbToShow, loadMore };
}

export function useOperationsList({
  account,
  parentAccount,
  accounts,
  withSubAccounts,
  filterOperation,
}: Props) {
  const spamFilteringTxFeature = useFeature("lldSpamFilteringTx");
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = Number(nftsFromSimplehashFeature?.params?.threshold);

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { nbToShow, loadMore } = usePagination(INITIAL_TO_SHOW);

  const { hideSpamCollection } = useHideSpamCollection();

  const markNftAsSpam = useCallback(
    (collectionId: string, blockchain: BlockchainsType, spamScore: number) => {
      if (spamFilteringTxEnabled && spamScore > thresold) {
        hideSpamCollection(collectionId, blockchain);
      }
    },
    [hideSpamCollection, spamFilteringTxEnabled, thresold],
  );

  const allAccounts = useSelector(accountsSelector);

  const all = flattenAccounts(accounts || []).concat(
    [account as AccountLike, parentAccount as AccountLike].filter(Boolean),
  );
  const accountsMap = keyBy(all, "id");

  const groupedOperations = account
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
      : undefined;

  const filteredData = useSpamTxFiltering(
    spamFilteringTxEnabled,
    accountsMap,
    groupedOperations,
    markNftAsSpam,
    nftsFromSimplehashFeature?.params?.threshold || 0,
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

  return {
    nbToShow,
    allAccounts,
    handleClickOperation,
    fetchMoreOperations: loadMore,
    groupedOperations: filteredData,
    accountsMap,
  };
}
