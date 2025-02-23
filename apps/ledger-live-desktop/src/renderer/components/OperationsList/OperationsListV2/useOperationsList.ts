import { Operation, AccountLike, Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";

import { flattenAccounts, getMainAccount } from "@ledgerhq/live-common/account/index";
import keyBy from "lodash/keyBy";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { BlockchainEVM, BlockchainsType } from "@ledgerhq/live-nft/supported";
import { useHideSpamCollection } from "~/renderer/hooks/nfts/useHideSpamCollection";
import { useFilterNftSpams } from "@ledgerhq/live-nft-react";
import logger from "~/renderer/logger";
import { usePagination } from "LLD/hooks/usePagination";
import {
  buildContractIndexNftOperations,
  buildCurrentOperationsPage,
  groupOperationsByDate,
  parseAccountOperations,
  splitNftOperationsFromAllOperations,
} from "../utils";

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

export function useOperationsList({
  account,
  parentAccount,
  accounts,
  withSubAccounts,
  filterOperation, // TODO: see if we need to filter operations
}: Props) {
  const allAccounts = useSelector(shallowAccountsSelector);
  const {
    hideSpamCollection,
    spamFilteringTxFeature,
    nftsFromSimplehashFeature,
    nftCollectionsStatusByNetwork,
  } = useHideSpamCollection();
  const thresold = Number(nftsFromSimplehashFeature?.params?.threshold) || 40;

  //both features must be enabled to enable spam filtering
  const spamFilteringTxEnabled =
    (nftsFromSimplehashFeature?.enabled && spamFilteringTxFeature?.enabled) || false;

  const { nbToShow, loadMore, skip } = usePagination(INITIAL_TO_SHOW, "FetchMoreOperations");

  // to avoid multiple state rendering, we store the previous filtered data in an indexed ref object
  const previousFilteredNftData = useRef({});

  const all = flattenAccounts(accounts || []).concat(
    [account as AccountLike, parentAccount as AccountLike].filter(Boolean),
  );
  const accountsMap = keyBy(all, "id");
  // similar to groupedOperations but with section based data structure
  const allAccountOps = parseAccountOperations(
    account
      ? filterOperation
        ? account.operations.filter(operation => filterOperation(operation, account))
        : account.operations
      : (withSubAccounts ? all : accounts)
          ?.map(a => a.operations)
          .flat()
          .sort((a, b) => {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          }),
  );
  const { opsWithoutNFTIN, opsWithNFTIN } = splitNftOperationsFromAllOperations(allAccountOps);
  const currentPageOpsWithoutNFTIN = opsWithoutNFTIN?.slice(0, nbToShow);
  const currentPageNFTIN = opsWithNFTIN?.slice(skip, skip + nbToShow);

  const relatedNFtOps = buildContractIndexNftOperations(currentPageNFTIN, accountsMap);

  const { filteredOps: filteredNftData, spamOps } = useFilterNftSpams(
    thresold,
    relatedNFtOps,
    currentPageNFTIN,
  );

  previousFilteredNftData.current = {
    ...previousFilteredNftData.current,
    ...keyBy(filteredNftData, "order"),
  };

  const groupedOperations = buildCurrentOperationsPage(
    Object.values(previousFilteredNftData.current),
    currentPageOpsWithoutNFTIN,
    nbToShow,
  );

  // TODO: place this callback in the right place
  const markNftAsSpam = useCallback(
    (collectionId: string, blockchain: BlockchainsType, spamScore: number) => {
      if (spamFilteringTxEnabled && spamScore > thresold) {
        hideSpamCollection(collectionId, blockchain);
      }
    },
    [hideSpamCollection, spamFilteringTxEnabled, thresold],
  );

  useEffect(() => {
    spamOps.forEach(op => {
      if (!nftCollectionsStatusByNetwork[op.currencyId as BlockchainEVM])
        markNftAsSpam(op.collectionId, op.currencyId as BlockchainEVM, op.spamScore);
    });
  }, [spamOps, markNftAsSpam, nftCollectionsStatusByNetwork]);

  const hasMore = nbToShow <= groupedOperations.length;

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

  // TODO: use defaultDailyOperations with a flatten structure
  return {
    getOperationProperties,
    handleClickOperation,
    fetchMoreOperations: loadMore,
    groupedOperations: groupedOperations ? groupOperationsByDate(groupedOperations) : [],
    accountsMap,
    nbToShow,
    hasMore,
  };
}
