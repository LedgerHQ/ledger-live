import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { FeeNotLoaded } from "@ledgerhq/errors";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { Address } from "@multiversx/sdk-core";
import BigNumber from "bignumber.js";
import {
  MultiversXAccount,
  MultiversXProtocolTransaction,
  MultiversXTransactionMode,
  Transaction,
} from "./types";
import { BinaryUtils } from "./utils/binary.utils";

function getOptimisticOperationType(transactionMode: MultiversXTransactionMode): OperationType {
  switch (transactionMode) {
    case "delegate":
      return "DELEGATE";
    case "unDelegate":
      return "UNDELEGATE";
    case "withdraw":
      return "WITHDRAW_UNBONDED";
    case "claimRewards":
      return "REWARD";
    case "reDelegateRewards":
      return "DELEGATE";
    default:
      return "OUT";
  }
}

function getOptimisticOperationDelegationAmount(transaction: Transaction): BigNumber | undefined {
  let dataDecoded;
  switch (transaction.mode) {
    case "delegate":
      return transaction.amount;

    case "unDelegate":
      dataDecoded = BinaryUtils.base64Decode(transaction.data ?? "");
      return new BigNumber(`0x${dataDecoded.split("@")[1]}`);

    default:
      return new BigNumber(0);
  }
}

export const buildOptimisticOperation = (
  account: MultiversXAccount,
  transaction: Transaction,
  unsignedTx: MultiversXProtocolTransaction,
): Operation => {
  const senders = [account.freshAddress];
  const recipients = [transaction.recipient];
  const { subAccountId, fees } = transaction;

  if (!fees) {
    throw new FeeNotLoaded();
  }

  const type = getOptimisticOperationType(transaction.mode);

  const tokenAccount =
    (subAccountId &&
      account.subAccounts &&
      account.subAccounts.find(ta => ta.id === subAccountId)) ||
    null;

  const value =
    tokenAccount || (transaction.mode !== "send" && transaction.mode !== "delegate")
      ? fees
      : transaction.amount.plus(transaction.fees || new BigNumber(0));

  const delegationAmount = getOptimisticOperationDelegationAmount(transaction);

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee: fees,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: account.id,
    transactionSequenceNumber: new BigNumber(unsignedTx.nonce),
    date: new Date(),
    extra: {
      amount: delegationAmount,
    },
  };

  const contract = new Address(transaction.recipient).isContractAddress()
    ? transaction.recipient
    : undefined;

  if (contract) {
    operation.contract = contract;
  }

  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: encodeOperationId(subAccountId, "", "OUT"),
        hash: "",
        type: "OUT",
        value: transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders,
        recipients,
        accountId: subAccountId,
        date: new Date(),
        extra: {},
      },
    ];
  }

  return operation;
};
