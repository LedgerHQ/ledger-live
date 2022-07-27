import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { Operation, OperationType } from "../../../types";
import { AvalanchePChainTransactions } from "../types";
import { encodeOperationId } from "../../../operation";
import { avalancheClient } from "./client";
import { makeLRUCache } from "../../../cache";
import { HDHelper } from "../hdhelper";
import { isDefaultValidatorNode, MINUTE, DAY, ONE_AVAX } from "../utils";

const getIndexerUrl = (route: string): string =>
  `${getEnv("API_AVALANCHE_INDEXER")}${route || ""}`;

const getExplorerUrl = (route: string): string =>
  `${getEnv("API_AVALANCHE_EXPLORER_API")}${route || ""}`;

export const getOperations = async (
  blockStartHeight: number,
  accountId: string
): Promise<Operation[]> => {
  const hdHelper = HDHelper.getInstance();
  const addresses = hdHelper.getAllDerivedAddresses();

  let operations: Operation[] = await fetchOperations(
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

  let { data } = await network({
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
      return convertSendAndReceiveToOperation(transaction, accountId, type);
    }
  }
};

const convertDelegationToOperation = (
  transaction,
  accountId,
  type
): Operation => {
  let value = new BigNumber(transaction.metadata.weight);

  return {
    id: encodeOperationId(accountId, transaction.id, type),
    hash: transaction.id,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: transaction.block_height,
    blockHash: transaction.block,
    accountId,
    date: new Date(transaction.timestamp),
    extra: {
      stakeValue: value,
    },
  };
};

const convertSendAndReceiveToOperation = (
  transaction,
  accountId,
  type
): Operation => {
  const fee = new BigNumber(transaction.fee);
  const outputIndex =
    transaction.type === AvalanchePChainTransactions.Import ? 0 : 1;
  let value = new BigNumber(
    transaction.outputs?.find((o) => o.index === outputIndex).amount
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

export const getAccount = async () => {
  const hdHelper = HDHelper.getInstance();
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

export const getDelegations = async () => {
  let allDelegators: any = [];
  const validators = await getValidators();

  for (let i = 0; i < validators.length; i++) {
    let validator = validators[i];
    if (validator.delegators == null) continue;
    allDelegators.push(...validator.delegators);
  }

  return getUserDelegations(allDelegators);
};

const getUserDelegations = (delegators) => {
  const hdHelper = HDHelper.getInstance();

  const userAddresses = hdHelper.getAllDerivedAddresses();

  let userDelegations = delegators.filter((d) => {
    let rewardAddresses = d.rewardOwner.addresses;
    let filteredByUser = rewardAddresses.filter((address) => {
      return userAddresses.includes(address);
    });

    return filteredByUser.length > 0;
  });

  userDelegations.sort((a, b) => {
    let startA = parseInt(a.startTime);
    let startB = parseInt(b.startTime);
    return startA - startB;
  });

  return userDelegations;
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
  let aStake = new BigNumber(a.stakeAmount);
  let bStake = new BigNumber(b.stakeAmount);

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

  let { data } = await network({
    method: "POST",
    data: {
      address: rawAddresses,
      disableCount: ["1"],
    },
    url: getExplorerUrl(`/v2/addressChains`),
  });

  return data.addressChains;
};
