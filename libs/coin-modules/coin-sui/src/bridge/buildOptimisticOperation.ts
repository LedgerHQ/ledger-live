import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getNonce, isFirstBond } from "./utils";
import {
  PalletMethod,
  SuiAccount,
  SuiOperation,
  SuiOperationExtra,
  SuiOperationMode,
  Transaction,
} from "../types";

const MODE_TO_TYPE: Record<SuiOperationMode | "default", OperationType> = {
  send: "OUT",
  bond: "BOND",
  unbond: "UNBOND",
  rebond: "BOND",
  withdrawUnbonded: "WITHDRAW_UNBONDED",
  nominate: "NOMINATE",
  chill: "CHILL",
  setController: "SET_CONTROLLER",
  claimReward: "REWARD_PAYOUT",
  default: "FEES",
};

const MODE_TO_PALLET_METHOD: Record<SuiOperationMode | "bondExtra" | "sendMax", PalletMethod> = {
  send: "balances.transferKeepAlive",
  sendMax: "balances.transferAllowDeath",
  bond: "staking.bond",
  bondExtra: "staking.bondExtra",
  unbond: "staking.unbond",
  rebond: "staking.rebond",
  withdrawUnbonded: "staking.withdrawUnbonded",
  nominate: "staking.nominate",
  chill: "staking.chill",
  setController: "staking.setController",
  claimReward: "staking.payoutStakers",
} as const;

const getExtra = (
  type: string,
  account: SuiAccount,
  transaction: Transaction,
): SuiOperationExtra => {
  const extra: SuiOperationExtra = {
    // palletMethod: MODE_TO_PALLET_METHOD[transaction.mode],
    palletMethod: MODE_TO_PALLET_METHOD.send,
  };

  if (transaction.mode == "send" && transaction.useAllAmount) {
    extra.palletMethod = MODE_TO_PALLET_METHOD["sendMax"];
  } else if (transaction.mode === "bond" && !isFirstBond(account)) {
    extra.palletMethod = MODE_TO_PALLET_METHOD["bondExtra"];
  }

  switch (type) {
    case "OUT":
      return { ...extra, transferAmount: new BigNumber(transaction.amount) };

    case "BOND":
      return { ...extra, bondedAmount: new BigNumber(transaction.amount) };

    case "UNBOND":
      return { ...extra, unbondedAmount: new BigNumber(transaction.amount) };

    // case "WITHDRAW_UNBONDED":
    //   return {
    //     ...extra,
    //     withdrawUnbondedAmount: new BigNumber(account.suiResources?.unlockedBalance || 0),
    //   };

    // case "NOMINATE":
    //   return { ...extra, validators: transaction.validators };
  }

  return extra;
};

export const buildOptimisticOperation = (
  account: SuiAccount,
  transaction: Transaction,
  fee: BigNumber,
): SuiOperation => {
  // const type = MODE_TO_TYPE[transaction.mode] ?? MODE_TO_TYPE.default;
  const type = MODE_TO_TYPE.default;
  const value = type === "OUT" ? new BigNumber(transaction.amount).plus(fee) : new BigNumber(fee);
  const extra = getExtra(type, account, transaction);
  const operation: SuiOperation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    transactionSequenceNumber: getNonce(account),
    date: new Date(),
    extra,
  };
  return operation;
};
