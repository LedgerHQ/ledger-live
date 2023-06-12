import { genAddress, genHex } from "@ledgerhq/coin-framework/mocks/helpers";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import Prando from "prando";
import type { AlgorandAccount } from "./types";

function setAlgorandResources(account: Account): Account {
  /** format algorandResources given the new delegations */
  (account as AlgorandAccount).algorandResources = {
    rewards: account.balance.multipliedBy(0.01),
    nbAssets: account.subAccounts?.length ?? 0,
  };
  return account;
}

function genBaseOperation(
  account: Account,
  rng: Prando,
  type: OperationType,
  index: number,
): Operation {
  const { operations: ops } = account;
  const address = genAddress(account.currency, rng);
  const lastOp = ops[index];
  const date = new Date(
    (lastOp ? lastOp.date.valueOf() : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next()),
  );
  const hash = genHex(64, rng);

  /** generate given operation */
  return {
    id: String(`mock_op_${ops.length}_${type}_${account.id}`),
    hash,
    type,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [address],
    recipients: [address],
    blockHash: genHex(64, rng),
    blockHeight:
      account.blockHeight -
      // FIXME: always the same, valueOf for arithmetics operation on date in typescript
      Math.floor((Date.now().valueOf() - date.valueOf()) / 900000),
    accountId: account.id,
    date,
    extra: {
      rewards: new BigNumber(0),
      memo: "memo",
    },
  };
}

function addOptIn(account: Account, rng: Prando): Account {
  /** select position on the operation stack where we will insert the new claim rewards */
  const opIndex = rng.next(0, 10);
  const opt = genBaseOperation(account, rng, "OPT_IN", opIndex);
  opt.extra = { ...opt.extra, rewards: new BigNumber(0), assetId: "Thether" };
  account.operations.splice(opIndex, 0, opt);
  account.operationsCount++;
  return account;
}

function addOptOut(account: Account, rng: Prando): Account {
  /** select position on the operation stack where we will insert the new claim rewards */
  const opIndex = rng.next(0, 10);
  const opt = genBaseOperation(account, rng, "OPT_OUT", opIndex);
  opt.extra = { ...opt.extra, rewards: new BigNumber(0), assetId: "Thether" };
  account.operations.splice(opIndex, 0, opt);
  account.operationsCount++;
  return account;
}

/**
 * add in specific algorand operations
 * @memberof algorand/mock
 * @param {Account} account
 * @param {Prando} rng
 */
function genAccountEnhanceOperations(account: Account, rng: Prando): Account {
  addOptIn(account, rng);
  addOptOut(account, rng);
  setAlgorandResources(account);
  return account;
}

/**
 * Update spendable balance for the account based on delegation data
 * @memberof algorand/mock
 * @param {Account} account
 */
function postSyncAccount(account: Account): Account {
  const algorandResources = (account as AlgorandAccount).algorandResources || {
    rewards: undefined,
  };
  const rewards = algorandResources.rewards || new BigNumber(0);
  account.spendableBalance = account.balance.plus(rewards);
  return account;
}

/**
 * post account scan data logic
 * clears account algorand resources if supposed to be empty
 * @memberof algorand/mock
 * @param {AlgorandAccount} account
 */
function postScanAccount(
  account: Account,
  {
    isEmpty,
  }: {
    isEmpty: boolean;
  },
): Account {
  if (isEmpty) {
    (account as AlgorandAccount).algorandResources = {
      rewards: new BigNumber(0),
      nbAssets: account.subAccounts?.length ?? 0,
    };
    account.operations = [];
    account.subAccounts = [];
  }

  return account;
}

export default {
  genAccountEnhanceOperations,
  postSyncAccount,
  postScanAccount,
};
