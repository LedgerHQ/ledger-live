import { getAccountRegistrationStatus, getPendingWithdrawals, getVotes } from "../network/sdk";
import { makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId } from "@ledgerhq/coin-framework/account";
import { getEnv } from "@ledgerhq/live-env";
import { CeloAccount } from "../types/types";
import { celoKit } from "../network/sdk";
import { BigNumber } from "bignumber.js";
import { createApi } from "@ledgerhq/coin-evm/api/index";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import { getCoinConfig } from "@ledgerhq/coin-evm/config";
import { getTokenFromAsset } from "@ledgerhq/coin-evm/logic/index";
import { createSwapHistoryMap, mergeSubAccounts, getSyncHash } from "@ledgerhq/coin-evm/logic";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";

import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { SyncConfig, TokenAccount } from "@ledgerhq/types-live";

const kit = celoKit();

const operationsTypes = [
  "IN",
  "OUT",
  "NONE",
  "LOCK",
  "UNLOCK",
  "WITHDRAW",
  "REVOKE",
  "ACTIVATE",
  "REGISTER",
  "VOTE",
] as const;

const SAFE_REORG_THRESHOLD = 80;

type OperationType = (typeof operationsTypes)[number];

const getTypeFromString = (value: string) => {
  const finding = operationsTypes.filter(item => {
    return item === value;
  });
  let result: OperationType = "NONE";
  if (finding.length > 0) {
    result = finding[0];
  }
  return result;
};

const resolveTypesFromContracts = (item: {
  type: OperationType;
  senders: string[];
  recipients: string[];
  address: string;
  value: bigint;
  contracts: {
    locked: string;
    election: string;
  };
}): OperationType => {
  if (item.type === "OUT" && item.recipients.includes(item.contracts.locked)) {
    const isZero = new BigNumber(item.value.toString()).isEqualTo(0);
    return isZero ? "UNLOCK" : "LOCK";
  }
  if (item.type === "OUT" && item.recipients.includes(item.contracts.election)) {
    return "VOTE";
  }

  return item.type;
};

const getOperationsList = async ({
  info,
  config,
  accountId,
  contracts,
}: {
  info: Parameters<GetAccountShape<CeloAccount>>[0];
  config: Parameters<GetAccountShape<CeloAccount>>[1];
  accountId: string;
  contracts: {
    locked: string;
    election: string;
  };
}) => {
  const { address, currency, initialAccount } = info;
  const blacklistedTokenIds = config.blacklistedTokenIds || [];
  const configEvm = {
    ...getCoinConfig(currency).info,
  } as const;

  const syncHash = await getSyncHash(currency, blacklistedTokenIds);
  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const latestSyncedHeight = shouldSyncFromScratch ? 0 : initialAccount.blockHeight;
  const api = createApi(configEvm, currency.id);
  const rawOperationsList = (
    await api.listOperations(address, {
      minHeight: Math.max(latestSyncedHeight - SAFE_REORG_THRESHOLD, 0),
    })
  )[0];

  const operationsList = await Promise.all(
    rawOperationsList.map(async item => {
      const token = await getTokenFromAsset(currency, item.asset);
      const type = getTypeFromString(item.type);
      const tokenAccountId = token ? encodeTokenAccountId(accountId, token) : accountId;

      const operation = {
        id: item.id,
        hash: item.tx.hash,
        type: resolveTypesFromContracts({
          type,
          senders: item.senders,
          recipients: item.recipients,
          address,
          value: item.value,
          contracts: contracts,
        }),
        value: new BigNumber((item.details?.assetAmount as string) || item.value.toString()),
        senders: item.senders,
        recipients: item.recipients,
        blockHeight: item.tx.block.height,
        blockHash: item.tx.block.hash,
        accountId: tokenAccountId,
        date: item.tx.date,
        hasFailed: item.tx.failed,
        fee: new BigNumber(item.tx.fees.toString()),
        transactionSequenceNumber: new BigNumber(0),
        extra: {},
        ...(token ? { token } : undefined),
        isSubAccount: token?.ticker !== "CELO" && item.asset.type !== "native",
      };

      return operation;
    }),
  );

  return operationsList;
};

const getSubAccounts = async ({
  list,
  blacklistedTokenIds = [],
  accountId,
  info,
}: {
  list: Awaited<ReturnType<typeof getOperationsList>>;
  blacklistedTokenIds: string[];
  accountId: string;
  info: Parameters<GetAccountShape<CeloAccount>>[0];
}) => {
  type TokenSchema = Required<(typeof list)[number]>;

  // Type Narrowing to set list of item with correct Schema
  const filterTokens = (item: (typeof list)[number]): item is TokenSchema =>
    item.isSubAccount &&
    !blacklistedTokenIds.includes(item.token?.id || "") &&
    !!item.token?.ticker;
  const erc20Operations = list.filter(filterTokens);

  const swapHistoryMap = createSwapHistoryMap(info.initialAccount);
  const tokensByKeys: Record<string, TokenAccount> = {};

  erc20Operations.reduce((acc, item) => {
    if (!acc[item.token.ticker]) {
      const tokenAccountId = item.token ? encodeTokenAccountId(accountId, item.token) : "";
      acc[item.token.ticker] = {
        type: "TokenAccount",
        id: tokenAccountId,
        parentId: accountId,
        token: item.token,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        creationDate: new Date(),
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
        balanceHistoryCache: emptyHistoryCache,
        swapHistory: swapHistoryMap.get(item.token.id) || [],
      };
    }

    const { token, ...itemRest } = item;

    acc[item.token.ticker].operations.push(itemRest);
    acc[item.token.ticker].operationsCount = acc[item.token.ticker].operations.length;

    return acc;
  }, tokensByKeys);

  const nodeApi = getNodeApi(info.currency);
  const tokensList = Object.values(tokensByKeys);
  const tokensListWithBalance = await Promise.all(
    tokensList.map(async item => {
      const balance = await nodeApi.getTokenBalance(
        info.currency,
        info.address,
        item.token.contractAddress,
      );

      return {
        ...item,
        balance,
        spendableBalance: balance,
      };
    }),
  );

  return tokensListWithBalance;
};

export const getAccountShape: GetAccountShape<CeloAccount> = async (info, config) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];
  const election = await kit.contracts.getElection();
  const electionConfig = await election.getConfig();
  const lockedGold = await kit.contracts.getLockedGold();
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);
  const pendingWithdrawals = accountRegistrationStatus ? await getPendingWithdrawals(address) : [];
  const votes = accountRegistrationStatus ? await getVotes(address) : [];

  const lockedBalance = await lockedGold.getAccountTotalLockedGold(address);
  const nonvotingLockedBalance = await lockedGold.getAccountNonvotingLockedGold(address);

  const configEvm = {
    ...getCoinConfig(currency).info,
  } as const;
  const blacklistedTokenIds = config.blacklistedTokenIds || [];
  const syncHash = await getSyncHash(currency, blacklistedTokenIds);

  const nodeApi = getNodeApi(currency);
  const api = createApi(configEvm, currency.id);
  const blockInfo = await api.lastBlock();
  const balance = await nodeApi.getCoinBalance(currency, address);

  const operationsList = await getOperationsList({
    info,
    config,
    accountId,
    contracts: { locked: lockedGold.address, election: election.address },
  });

  const nativeOperations = operationsList.filter(({ isSubAccount }) => !isSubAccount);
  const subAccountsList = await getSubAccounts({
    list: operationsList,
    blacklistedTokenIds,
    accountId,
    info,
  });

  const shouldSyncFromScratch =
    syncHash !== initialAccount?.syncHash || initialAccount === undefined;
  const operations = shouldSyncFromScratch
    ? nativeOperations
    : mergeOps(oldOperations, nativeOperations);

  const subAccounts =
    shouldSyncFromScratch && initialAccount?.subAccounts
      ? subAccountsList
      : (mergeSubAccounts(initialAccount, subAccountsList) as TokenAccount[]);

  const shape: Partial<CeloAccount> = {
    id: accountId,
    balance: balance.plus(lockedBalance) || new BigNumber(0),
    blockHeight: blockInfo.height || 0,
    operations,
    operationsCount: operations.length,
    spendableBalance: balance || new BigNumber(0),
    subAccounts: getEnv("ENABLE_CELO_TOKENS") ? subAccounts : [],
    syncHash: syncHash,
    celoResources: {
      registrationStatus: false,
      lockedBalance,
      nonvotingLockedBalance,
      pendingWithdrawals,
      votes,
      electionAddress: election.address,
      lockedGoldAddress: lockedGold.address,
      maxNumGroupsVotedFor: electionConfig.maxNumGroupsVotedFor,
    },
  };

  return shape;
};

export const sync = makeSync({ getAccountShape });
