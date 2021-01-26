//@flow
import network from "../../../network";
import querystring from "querystring";

import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "../../../operation";

import { getEnv } from "../../../env";
import { getOperationType } from "./common";
import type { OperationType, Operation } from "../../../types";

const LIMIT = 200;

/**
 * Return the url of the indexer
 *
 * @returns {string}
 */
const getBaseApiUrl = (): string => getEnv("API_POLKADOT_INDEXER");

/**
 * Fetch operation lists from indexer
 *
 * @param {string} addr
 * @param {number} offset
 * @param {number} startAt
 * @param {number} limit
 *
 * @returns {string}
 */
const getAccountOperationUrl = (
  addr: string,
  offset: number,
  startAt: number,
  limit: number = LIMIT
): string =>
  `${getBaseApiUrl()}/accounts/${addr}/operations?${querystring.stringify({
    limit,
    offset,
    startAt,
  })}`;

const getWithdrawUnbondedAmount = (extrinsic) => {
  return (
    extrinsic?.staking?.eventStaking.reduce((acc, curr) => {
      return curr.method === "Withdrawn"
        ? BigNumber(acc).plus(curr.value)
        : BigNumber(0);
    }, BigNumber(0)) || BigNumber(0)
  );
};

/**
 * add Extra info for operation details
 *
 * @param {OperationType} type
 * @param {*} extrinsic
 *
 * @returns {Object}
 */
const getExtra = (type: OperationType, extrinsic: *): Object => {
  let extra = {
    palletMethod: `${extrinsic.section}.${extrinsic.method}`,
  };

  switch (type) {
    case "IN":
    case "OUT":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = { ...extra, transferAmount: BigNumber(extrinsic.amount) };
      }
      break;

    case "BOND":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = { ...extra, bondedAmount: BigNumber(extrinsic.amount) };
      }
      break;

    case "UNBOND":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = {
          ...extra,
          unbondedAmount: BigNumber(extrinsic.amount),
        };
      }
      break;

    case "WITHDRAW_UNBONDED":
      extra = {
        ...extra,
        withdrawUnbondedAmount: getWithdrawUnbondedAmount(extrinsic),
      };
      break;

    case "REWARD_PAYOUT":
    case "SLASH":
      extra = {
        ...extra,
        validatorStash: extrinsic.validatorStash,
        amount: BigNumber(extrinsic.value),
      };
      break;

    case "NOMINATE":
      extra = {
        ...extra,
        validators:
          extrinsic.staking?.validators?.reduce((acc, current) => {
            return [...acc, current.address];
          }, []) ?? [],
      };
      break;
  }

  return extra;
};

/**
 * Returns the operation value (amount if relevant + fees) depending on type
 *
 * @param {*} extrinsic
 * @param {OperationType} type
 *
 * @returns {BigNumber}
 */
const getValue = (extrinsic, type: OperationType): BigNumber => {
  if (!extrinsic.isSuccess) {
    return type === "IN" ? BigNumber(0) : BigNumber(extrinsic.partialFee || 0);
  }

  switch (type) {
    case "OUT":
      return extrinsic.signer !== extrinsic.affectedAddress1
        ? BigNumber(extrinsic.amount).plus(extrinsic.partialFee)
        : BigNumber(extrinsic.partialFee);
    case "IN":
    case "SLASH":
      return BigNumber(extrinsic.amount);

    default:
      return BigNumber(extrinsic.partialFee);
  }
};

/**
 * Map extrinsic into the live operation type
 *
 * @param {string} addr
 * @param {string} accountId
 * @param {*} extrinsic
 *
 * @returns {Operation | null}
 */
const extrinsicToOperation = (
  addr: string,
  accountId: string,
  extrinsic
): $Shape<Operation> | null => {
  let type = getOperationType(extrinsic.section, extrinsic.method);
  if (
    type === "OUT" &&
    extrinsic.affectedAddress1 === addr &&
    extrinsic.signer !== addr
  ) {
    type = "IN";
  }

  if (type !== "IN" && extrinsic.signer !== addr) {
    return null;
  }

  return {
    id: encodeOperationId(accountId, extrinsic.hash, type),
    accountId,
    fee: BigNumber(extrinsic.partialFee || 0),
    value: getValue(extrinsic, type),
    type,
    hash: extrinsic.hash,
    blockHeight: extrinsic.blockNumber,
    date: new Date(extrinsic.timestamp),
    extra: getExtra(type, extrinsic),
    senders: [extrinsic.signer],
    recipients: [extrinsic.affectedAddress1, extrinsic.affectedAddress2].filter(
      Boolean
    ),
    transactionSequenceNumber:
      extrinsic.signer === addr ? extrinsic.nonce : undefined,
    hasFailed: !extrinsic.isSuccess,
  };
};

/**
 * Map reward to live operation type
 *
 * @param {string} addr
 * @param {string} accountId
 * @param {*} reward
 *
 * @returns {Operation | null}
 */
const rewardToOperation = (
  addr: string,
  accountId: string,
  reward
): $Shape<Operation> => {
  const hash = reward.extrinsicHash;
  const type = "REWARD_PAYOUT";

  return {
    id: encodeOperationId(accountId, `${hash}+${reward.index}`, type),
    accountId,
    fee: BigNumber(0),
    value: BigNumber(reward.value),
    type: type,
    hash,
    blockHeight: reward.blockNumber,
    date: new Date(reward.timestamp),
    extra: getExtra(type, reward),
    senders: [reward.validatorStash].filter(Boolean),
    recipients: [reward.accountId].filter(Boolean),
  };
};

/**
 * Map slash to live operation type
 *
 * @param {string} addr
 * @param {string} accountId
 * @param {*} slash
 *
 * @returns {Operation | null}
 */
const slashToOperation = (
  addr: string,
  accountId: string,
  slash
): $Shape<Operation> => {
  const hash = `${slash.blockNumber}`;
  const type = "SLASH";

  return {
    id: encodeOperationId(accountId, `${hash}+${slash.index}`, type),
    accountId,
    fee: BigNumber(0),
    value: BigNumber(slash.value),
    type: type,
    hash: hash,
    blockHeight: slash.blockNumber,
    senders: [slash.validatorStash].filter(Boolean),
    recipients: [slash.accountId].filter(Boolean),
    date: new Date(slash.timestamp),
    extra: getExtra(type, slash),
  };
};

/**
 * Fetch loop with multiple operations per page / offsite / start
 *
 * @param {string} accountId
 * @param {string} addr
 * @param {number} startAt
 * @param {number} offset
 *
 * @param {Operation[]} prevOperations
 */
const fetchOperationList = async (
  accountId: string,
  addr: string,
  startAt: number,
  offset: number = 0,
  prevOperations: Operation[] = []
) => {
  const { data } = await network({
    method: "GET",
    url: getAccountOperationUrl(addr, offset, startAt),
  });

  const operations = data.extrinsics.map((extrinsic) =>
    extrinsicToOperation(addr, accountId, extrinsic)
  );

  const rewards = data.rewards.map((reward) =>
    rewardToOperation(addr, accountId, reward)
  );

  const slashes = data.slashes.map((slash) =>
    slashToOperation(addr, accountId, slash)
  );

  const mergedOp = [...prevOperations, ...operations, ...rewards, ...slashes];

  if (
    operations.length < LIMIT &&
    rewards.length < LIMIT &&
    slashes.length < LIMIT
  ) {
    return mergedOp.filter(Boolean).sort((a, b) => b.date - a.date);
  }

  return await fetchOperationList(
    accountId,
    addr,
    startAt,
    offset + LIMIT,
    mergedOp
  );
};

/**
 * Fetch all operations for a single account from indexer
 *
 * @param {string} accountId
 * @param {string} addr
 * @param {number} startAt - blockHeight after which you fetch this op (included)
 *
 * @return {Operation[]}
 */
export const getOperations = async (
  accountId: string,
  addr: string,
  startAt: number = 0
) => {
  return await fetchOperationList(accountId, addr, startAt);
};
