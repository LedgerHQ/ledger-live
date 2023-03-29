import type { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import querystring from "querystring";
import { BigNumber } from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getEnv } from "@ledgerhq/live-env";
import { getOperationType } from "./common";
import type { OperationType, Operation } from "@ledgerhq/types-live";
import { isValidAddress } from "../address";

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

const getWithdrawUnbondedAmount = (extrinsic: any) => {
  return (
    extrinsic?.staking?.eventStaking.reduce((acc: any, curr: any) => {
      return curr.method === "Withdrawn"
        ? new BigNumber(acc).plus(curr.value)
        : new BigNumber(0);
    }, new BigNumber(0)) || new BigNumber(0)
  );
};

const getController = (_extrinsic: any) => {
  // TODO: ask BisonTrails to provide the info
  return "";
};

/**
 * add Extra info for operation details
 *
 * @param {OperationType} type
 * @param {*} extrinsic
 *
 * @returns {Object}
 */
const getExtra = (type: OperationType, extrinsic: any): Record<string, any> => {
  let extra: {
    transferAmount?: BigNumber;
    palletMethod: string;
    bondedAmount?: BigNumber;
    unbondedAmount?: BigNumber;
    amount?: BigNumber;
    withdrawUnbondedAmount?: any;
    validatorStash?: any;
    validators?: any;
    controller?: any;
  } = {
    palletMethod: `${extrinsic.section}.${extrinsic.method}`,
  };

  switch (type) {
    case "IN":
    case "OUT":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = { ...extra, transferAmount: new BigNumber(extrinsic.amount) };
      }

      break;

    case "BOND":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = { ...extra, bondedAmount: new BigNumber(extrinsic.amount) };
      }

      break;

    case "UNBOND":
      if (extrinsic.amount || extrinsic.amount === 0) {
        extra = { ...extra, unbondedAmount: new BigNumber(extrinsic.amount) };
      }

      break;

    case "WITHDRAW_UNBONDED":
      extra = {
        ...extra,
        withdrawUnbondedAmount: getWithdrawUnbondedAmount(extrinsic),
      };
      break;

    case "SET_CONTROLLER":
      extra = {
        ...extra,
        controller: getController(extrinsic),
      };
      break;

    case "REWARD_PAYOUT":
    case "SLASH":
      extra = {
        ...extra,
        validatorStash: extrinsic.validatorStash,
        amount: new BigNumber(extrinsic.value),
      };
      break;

    case "NOMINATE":
      extra = {
        ...extra,
        validators:
          extrinsic.staking?.validators?.reduce((acc: any, current: any) => {
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
const getValue = (extrinsic: any, type: OperationType): BigNumber => {
  if (!extrinsic.isSuccess) {
    return type === "IN"
      ? new BigNumber(0)
      : new BigNumber(extrinsic.partialFee || 0);
  }

  switch (type) {
    case "OUT":
      return extrinsic.signer !== extrinsic.affectedAddress1
        ? new BigNumber(extrinsic.amount).plus(extrinsic.partialFee)
        : new BigNumber(extrinsic.partialFee);

    case "IN":
    case "SLASH":
      return new BigNumber(extrinsic.amount);

    default:
      return new BigNumber(extrinsic.partialFee);
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
  extrinsic: any
): Partial<Operation> | null => {
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
    fee: new BigNumber(extrinsic.partialFee || 0),
    value: getValue(extrinsic, type),
    type,
    hash: extrinsic.hash,
    blockHeight: extrinsic.blockNumber,
    date: new Date(extrinsic.timestamp),
    extra: getExtra(type, extrinsic),
    senders: [extrinsic.signer],
    recipients: [extrinsic.affectedAddress1, extrinsic.affectedAddress2]
      .filter(Boolean)
      .filter(isValidAddress),
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
  reward: any
): Partial<Operation> => {
  const hash = reward.extrinsicHash;
  const type = "REWARD_PAYOUT";
  return {
    id: encodeOperationId(accountId, `${hash}+${reward.index}`, type),
    accountId,
    fee: new BigNumber(0),
    value: new BigNumber(reward.value),
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
  slash: any
): Partial<Operation> => {
  const hash = `${slash.blockNumber}`;
  const type = "SLASH";
  return {
    id: encodeOperationId(accountId, `${hash}+${slash.index}`, type),
    accountId,
    fee: new BigNumber(0),
    value: new BigNumber(slash.value),
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
const fetchOperationList =
  (network: NetworkRequestCall) =>
  async (
    accountId: string,
    addr: string,
    startAt: number,
    offset = 0,
    prevOperations: Operation[] = []
  ): Promise<Operation[]> => {
    const { data } = await network({
      method: "GET",
      url: getAccountOperationUrl(addr, offset, startAt),
    });
    const operations = data.extrinsics.map((extrinsic: any) =>
      extrinsicToOperation(addr, accountId, extrinsic)
    );
    const rewards = data.rewards.map((reward: any) =>
      rewardToOperation(addr, accountId, reward)
    );
    const slashes = data.slashes.map((slash: any) =>
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

    return await fetchOperationList(network)(
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
export const getOperations =
  (network: NetworkRequestCall) =>
  async (accountId: string, addr: string, startAt = 0) => {
    return await fetchOperationList(network)(accountId, addr, startAt);
  };
