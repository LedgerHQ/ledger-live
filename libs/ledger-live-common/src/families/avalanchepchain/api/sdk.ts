import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { AvalancheDelegationRaw, AvalanchePChainTransactions } from "../types";
import { encodeOperationId } from "../../../operation";
import { avalancheClient } from "./client";
import { makeLRUCache } from "../../../cache";
import { HDHelper } from "../hdhelper";
import { isDefaultValidatorNode, MINUTE, DAY, ONE_AVAX } from "../utils";
import {
  getHistoryP,
  OrteliusAvalancheTx,
} from "@avalabs/avalanche-wallet-sdk";

const getIndexerUrl = (route: string): string =>
  `${getEnv("API_AVALANCHE_INDEXER")}${route || ""}`;

const getExplorerUrl = (route: string): string =>
  `${getEnv("API_AVALANCHE_EXPLORER_API")}${route || ""}`;

export const getOperations = async (
  blockStartHeight: number,
  accountId: string,
  publicKey: string,
  chainCode: string
): Promise<Operation[]> => {
  const hdHelper = await HDHelper.instantiate(publicKey, chainCode);
  const addresses = hdHelper.getAllDerivedAddresses();

  const operations: Operation[] = await fetchOperations(
    addresses,
    blockStartHeight
  );

  const pChainOperations = operations.filter(getPChainOperations);

  return pChainOperations.map((o) =>
    convertTransactionToOperation(o, accountId)
  );
};

/**
 * Fetch operation list from indexer
 */
const fetchOperations = async (addresses: string[], startHeight: number) => {
  const ADDRESS_SIZE = 1024;
  const selection = addresses.slice(0, ADDRESS_SIZE);
  const remaining = addresses.slice(ADDRESS_SIZE);

  const rawAddresses = selection.map(removeChainPrefix).join(",");

  const { data } = await network({
    method: "GET",
    url: getIndexerUrl(
      `/transactions?address=${rawAddresses}&start_height=${startHeight}&limit=100`
    ),
  });

  if (remaining.length > 0) {
    const nextOperations = await fetchOperations(remaining, startHeight);
    data.push(...nextOperations);
  }

  return data;
};

/**
 * Remove the chain prefix (e.g "P-") from the address
 * @param address - "P-avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn"
 * @returns avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn
 */
const removeChainPrefix = (address: string) => address.split("-")[1];

const convertTransactionToOperation = (transaction, accountId): Operation => {
  const type = getOperationType(transaction.type);

  switch (type) {
    case "DELEGATE": {
      return convertDelegationToOperation(transaction, accountId, type);
    }
    default: {
      return convertExportAndImportToOperation(transaction, accountId, type);
    }
  }
};

const convertDelegationToOperation = (
  transaction,
  accountId,
  type
): Operation => {
  const stakeValue = new BigNumber(transaction.metadata.weight);

  return {
    id: encodeOperationId(accountId, transaction.id, type),
    hash: transaction.id,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(transaction.fee),
    senders: [],
    recipients: [transaction.metadata.node_id],
    blockHeight: transaction.block_height,
    blockHash: transaction.block,
    accountId,
    date: new Date(transaction.timestamp),
    extra: {
      stakeValue,
    },
  };
};

const convertExportAndImportToOperation = (
  transaction,
  accountId,
  type
): Operation => {
  const fee = new BigNumber(transaction.fee);
  const outputIndex =
    transaction.type === AvalanchePChainTransactions.Import ? 0 : 1;
  let value = new BigNumber(
    transaction.outputs?.find((o) => o.index === outputIndex)?.amount ??
      transaction.outputs?.find((o) => o.index === 0).amount
  );

  if (transaction.type === AvalanchePChainTransactions.Export) {
    value = value.plus(fee);
  }

  return {
    id: encodeOperationId(accountId, transaction.id, type),
    hash: transaction.id,
    type,
    value,
    fee,
    senders: transaction.inputs?.[0].addresses ?? [],
    recipients: transaction.outputs?.[0].addresses ?? [],
    blockHeight: transaction.block_height,
    blockHash: transaction.block,
    accountId,
    date: new Date(transaction.timestamp),
    extra: {},
  };
};

const getOperationType = (type: string): OperationType => {
  switch (type) {
    case AvalanchePChainTransactions.Export:
      return "OUT";
    case AvalanchePChainTransactions.Import:
      return "IN";
    case AvalanchePChainTransactions.Delegate:
      return "DELEGATE";
    default:
      return "NONE";
  }
};

const getPChainOperations = ({ type }) =>
  type === AvalanchePChainTransactions.Import ||
  type === AvalanchePChainTransactions.Export ||
  type === AvalanchePChainTransactions.Delegate;

export const getAccount = async (publicKey: string, chainCode: string) => {
  const hdHelper = await HDHelper.instantiate(publicKey, chainCode);
  const { available, locked, lockedStakeable, multisig } =
    await hdHelper.fetchBalances();
  const stakedBalance = await hdHelper.fetchStake();
  const balance = available.plus(locked).plus(lockedStakeable).plus(multisig);
  const blockHeight = await avalancheClient().PChain().getHeight();

  return {
    balance,
    stakedBalance,
    blockHeight: blockHeight.toNumber(),
  };
};

export const getDelegations = async (
  publicKey: string,
  chainCode: string
): Promise<AvalancheDelegationRaw[]> => {
  const hdHelper = await HDHelper.instantiate(publicKey, chainCode);

  const userAddresses = hdHelper.getAllDerivedAddresses();
  const addressHistory = await getHistoryP(userAddresses);

  const currentDate = Math.floor(Date.now() / 1000);

  const isCurrentDelegation = (history: OrteliusAvalancheTx) =>
    history.type === "add_delegator" && currentDate < history.validatorEnd;

  const currentDelegations = addressHistory.filter(isCurrentDelegation);

  const getStakeAmount = (outputs) => {
    const totalStake = outputs.reduce((acc, out) => {
      if (out.stake) {
        return acc.plus(new BigNumber(out.amount));
      }
      return acc;
    }, new BigNumber(0));
    return totalStake.toString();
  };

  const mappedDelegations = currentDelegations.map((d) => ({
    txID: d.id,
    startTime: d.validatorStart.toString(),
    endTime: d.validatorEnd.toString(),
    stakeAmount: getStakeAmount(d.outputs),
    nodeID: d.validatorNodeID,
  }));

  mappedDelegations.sort((a, b) => {
    const startA = parseInt(a.startTime);
    const startB = parseInt(b.startTime);
    return startA - startB;
  });

  return mappedDelegations;
};

export const getValidators = makeLRUCache(async () => {
  let { validators } = (await avalancheClient()
    .PChain()
    .getCurrentValidators()) as any;

  validators = await calculateRemainingStake(validators);

  return customValidatorOrder(validators);
});

const calculateRemainingStake = async (validators) => {
  const allPendingDelegators = await avalancheClient()
    .PChain()
    .getPendingValidators();

  const THREE_MILLION_AVAX = new BigNumber(ONE_AVAX).multipliedBy(3000000);

  return validators.map((v) => {
    const validatorStakeAmount = new BigNumber(v.stakeAmount);
    const absoluteMaxStake = new BigNumber(THREE_MILLION_AVAX);
    const relativeMaxStake = new BigNumber(validatorStakeAmount).multipliedBy(
      5
    );
    const stakeLimit = BigNumber.minimum(absoluteMaxStake, relativeMaxStake);
    const nodePendingDelegators = allPendingDelegators[v.nodeID];

    const delegatedStake = calculateDelegatedAmount(v.delegators);
    const delegatedPendingStake = calculateDelegatedAmount(
      nodePendingDelegators
    );

    const remainingStake = stakeLimit
      .minus(validatorStakeAmount)
      .minus(delegatedStake)
      .minus(delegatedPendingStake);

    return {
      ...v,
      remainingStake: new BigNumber(remainingStake),
    };
  });
};

const calculateDelegatedAmount = (delegators) => {
  if (delegators) {
    return delegators.reduce((acc, d) => {
      return acc.plus(new BigNumber(d.stakeAmount));
    }, new BigNumber(0));
  }

  return new BigNumber(0);
};

const customValidatorOrder = (validators) => {
  const defaultValidator = validators.find((v) =>
    isDefaultValidatorNode(v.nodeID)
  );

  const validatorGroupsSortedByStakeAmount = validators.sort(
    orderByStakeAmount()
  );

  if (defaultValidator) {
    return [
      defaultValidator,
      ...validatorGroupsSortedByStakeAmount.filter(
        (v) => !isDefaultValidatorNode(v.nodeID)
      ),
    ];
  }

  return validatorGroupsSortedByStakeAmount;
};

const orderByStakeAmount = () => (a, b) => {
  const aStake = new BigNumber(a.stakeAmount);
  const bStake = new BigNumber(b.stakeAmount);

  if (aStake.gt(bStake)) {
    return -1;
  } else if (aStake.lt(bStake)) {
    return 1;
  } else {
    return 0;
  }
};

export const customValidatorFilter = async (validators) => {
  let { minDelegatorStake } = await avalancheClient()
    .PChain()
    .getMinStake(true);
  minDelegatorStake = new BigNumber(minDelegatorStake);

  return validators
    .filter(removeExpiringValidators)
    .filter(removeValidatorsWithoutAvailableStake(minDelegatorStake));
};

const removeExpiringValidators = (validator) => {
  const now = Math.floor(Date.now() / 1000);
  const endTime = parseInt(validator.endTime);
  const diff = endTime - now;
  const threshold = DAY * 14 + 10 * MINUTE;

  // If end time is less than 2 weeks and 10 minutes, remove from validator list
  return diff > threshold;
};

const removeValidatorsWithoutAvailableStake = (minimumStake) => (validator) => {
  return !validator.remainingStake.lt(minimumStake);
};

export const getAddressChains = async (addresses: string[]) => {
  const rawAddresses = addresses.map(removeChainPrefix);

  const { data } = await network({
    method: "POST",
    data: {
      address: rawAddresses,
      disableCount: ["1"],
    },
    url: getExplorerUrl(`/v2/addressChains`),
  });

  return data.addressChains;
};
