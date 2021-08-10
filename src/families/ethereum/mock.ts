import Prando from "prando";
import { BigNumber } from "bignumber.js";
import type {
  Account,
  AccountLike,
  Operation,
  OperationType,
} from "../../types";
import { genOperation } from "../../mock/account";
import { findCompoundToken } from "../../currencies";

function genBaseOperation({
  account,
  parentAccount,
  rng,
  type,
  amount,
}: {
  account: AccountLike;
  parentAccount: Account;
  rng: Prando;
  type: OperationType;
  amount?: BigNumber;
}): Operation {
  const { operations: ops } = account;
  const op = genOperation(parentAccount, account, ops, rng);
  op.type = type;

  if (["REDEEM", "SUPPLY"].includes(type)) {
    op.extra = {
      // FIXME make it more realistic using function of time
      rate: rng.next(0.005, 0.01),
    };
  }

  if (amount && ["REDEEM", "SUPPLY"].includes(type)) {
    op.extra = { ...op.extra, compoundValue: amount.toString() };
    op.value = amount.times(op.extra.rate);
  } else if (amount) {
    op.value = amount;
  }

  ops.push(op);
  return op;
}

function addOperationWithType(
  account: Account,
  rng: Prando,
  type: OperationType,
  amount?: BigNumber
) {
  const subAccounts = account?.subAccounts?.length ? account.subAccounts : [];
  const daiAccount = subAccounts.find(
    (sub) => sub.type === "TokenAccount" && findCompoundToken(sub.token)
  );
  genBaseOperation({
    parentAccount: account,
    account: daiAccount || account,
    rng,
    type,
    amount,
  });
  return account;
}

function addSupplyOperations(
  account: Account,
  rng: Prando,
  supplyVal: BigNumber
): Account {
  addOperationWithType(account, rng, "SUPPLY", supplyVal);
  return account;
}

function addRedeemOperations(
  account: Account,
  rng: Prando,
  redeemVal: BigNumber
): Account {
  addOperationWithType(account, rng, "REDEEM", redeemVal);
  return account;
}

function addApproveOperations(account: Account, rng: Prando): Account {
  addOperationWithType(account, rng, "APPROVE");
  return account;
}

function genAccountEnhanceOperations(account: Account, rng: Prando): Account {
  const nbrRounds = rng.nextInt(1, 4);
  const output: Array<{
    args: [Account, Prando, BigNumber];
    type: string;
  }> = [];
  let redeemable = 0;

  for (let i = 0; i < nbrRounds; i++) {
    let toSupply = rng.nextInt(0, 3000);
    redeemable += toSupply;
    let toRedeem = rng.nextInt(0, redeemable);
    const nbrSupplyOps = rng.nextInt(1, 2);
    const nbrRedeemOps = rng.nextInt(1, 2);

    for (let j = 0; j < nbrSupplyOps; j++) {
      const supplyVal =
        j === nbrSupplyOps - 1 ? toSupply : rng.nextInt(0, toSupply);
      toSupply -= supplyVal;
      output.push({
        args: [account, rng, new BigNumber(supplyVal)],
        type: "supply",
      }); // addSupplyOperations(account, rng, BigNumber(supplyVal));
    }

    for (let k = 0; k < nbrRedeemOps; k++) {
      const redeemVal =
        k === nbrRedeemOps - 1 ? toRedeem : rng.nextInt(0, toRedeem);
      toRedeem -= redeemVal;
      redeemable -= redeemVal;
      output.push({
        args: [account, rng, new BigNumber(redeemVal)],
        type: "redeem",
      }); // addRedeemOperations(account, rng, BigNumber(redeemVal));
    }
  }

  output.reverse().forEach(({ args, type }) => {
    if (type === "supply") {
      addSupplyOperations(...args);
    }

    if (type === "redeem") {
      addRedeemOperations(...args);
    }
  });
  addApproveOperations(account, rng);
  return account;
}

function postSyncAccount(account: Account): Account {
  return account;
}

function postScanAccount(account: Account): Account {
  return account;
}

export default {
  genAccountEnhanceOperations,
  postSyncAccount,
  postScanAccount,
};
