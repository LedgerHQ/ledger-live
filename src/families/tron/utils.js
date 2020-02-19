// @flow
import bs58check from "bs58check";
import { BigNumber } from "bignumber.js";
import get from "lodash/get";
import type { Transaction, TronOperationMode, TrongridTxInfo } from "./types";
import type { Account, Operation, OperationType } from "../../types";

export const decode58Check = (base58: string) =>
  Buffer.from(bs58check.decode(base58)).toString("hex");

export const encode58Check = (hex: string) =>
  bs58check.encode(Buffer.from(hex, "hex"));

// see: https://solidity.readthedocs.io/en/v0.6.1/abi-spec.html#function-selector-and-argument-encoding
export const abiEncodeTrc20Transfer = (
  address: string,
  amount: BigNumber
): string => {
  const encodedAddress = address.padStart(64, "0");
  const hexAmount = amount.toNumber().toString(16); // convert to hexadecimal
  const encodedAmount = hexAmount.padStart(64, "0");
  return encodedAddress.concat(encodedAmount);
};

export const hexToAscii = (hex: string) =>
  Buffer.from(hex, "hex").toString("ascii");

const parentTx = [
  "TransferContract",
  "FreezeBalanceContract",
  "UnfreezeBalanceContract",
  "VoteWitnessContract",
  "WithdrawBalanceContract",
  "ExchangeTransactionContract"
];

export const isParentTx = (tx: TrongridTxInfo): boolean =>
  parentTx.includes(tx.type);

// This is an estimation, there is no endpoint to calculate the real size of a block before broadcasting it.
export const getEstimatedBlockSize = (a: Account, t: Transaction): number => {
  switch (t.mode) {
    case "send": {
      const subAccount =
        t.subAccountId && a.subAccounts
          ? a.subAccounts.find(sa => sa.id === t.subAccountId)
          : null;
      if (subAccount && subAccount.type === "TokenAccount") {
        if (subAccount.token.tokenType === "trc10") return 285;
        if (subAccount.token.tokenType === "trc20") return 350;
      }
      return 270;
    }
    case "freeze":
    case "unfreeze":
    case "claimReward":
      return 260;
    case "vote":
      return 290 + t.votes.length * 19;
    default:
      return 0;
  }
};

export const getOperationTypefromMode = (
  mode: TronOperationMode
): OperationType => {
  switch (mode) {
    case "send":
      return "OUT";
    case "freeze":
      return "FREEZE";
    case "unfreeze":
      return "UNFREEZE";
    case "vote":
      return "VOTE";
    case "claimReward":
      return "REWARD";
    default:
      return "OUT";
  }
};

const getOperationType = (
  tx: TrongridTxInfo,
  accountAddr: string
): ?OperationType => {
  switch (tx.type) {
    case "TransferContract":
    case "TransferAssetContract":
    case "TriggerSmartContract":
      return tx.from === accountAddr ? "OUT" : "IN";
    case "ExchangeTransactionContract":
      return "OUT";
    case "FreezeBalanceContract":
      return "FREEZE";
    case "UnfreezeBalanceContract":
      return "UNFREEZE";
    case "VoteWitnessContract":
      return "VOTE";
    case "WithdrawBalanceContract":
      return "REWARD";
    default:
      return undefined;
  }
};

export const formatTrongridTxResponse = (
  tx: Object,
  isInTrc20: boolean = false
): TrongridTxInfo => {
  try {
    if (isInTrc20) {
      const {
        from,
        to,
        block_timestamp,
        detail,
        value,
        transaction_id,
        token_info
      } = tx;
      const type = "TriggerSmartContract";
      const txID = transaction_id;
      const date = new Date(block_timestamp);
      const tokenId = get(token_info, "address", undefined);
      const formattedValue = value ? BigNumber(value) : BigNumber(0);
      const fee = detail && detail.fee ? BigNumber(detail.fee) : undefined;

      return {
        txID,
        date,
        type,
        tokenId,
        from,
        to,
        value: formattedValue,
        fee
      };
    } else {
      const { txID, block_timestamp, detail } = tx;

      const date = new Date(block_timestamp);

      const type = get(tx, "raw_data.contract[0].type", "");

      const {
        amount,
        asset_name,
        owner_address,
        to_address,
        resource_type,
        contract_address,
        quant
      } = get(tx, "raw_data.contract[0].parameter.value", {});

      const tokenId =
        type === "TransferAssetContract"
          ? asset_name
          : type === "TriggerSmartContract" && contract_address
          ? encode58Check(contract_address)
          : undefined;

      const from = encode58Check(owner_address);

      const to = to_address ? encode58Check(to_address) : undefined;

      const resource = resource_type;

      const getValue = (): BigNumber => {
        switch (type) {
          case "WithdrawBalanceContract":
            return BigNumber(detail.withdraw_amount);
          case "ExchangeTransactionContract":
            return BigNumber(quant);
          default:
            return amount ? BigNumber(amount) : BigNumber(0);
        }
      };

      const value = getValue();

      const fee = detail && detail.fee ? BigNumber(detail.fee) : undefined;

      return {
        txID,
        date,
        type,
        tokenId,
        from,
        to,
        value,
        fee,
        resource
      };
    }
  } catch (e) {
    // Should not happen unless Trongrid change response models.
    throw new Error(
      "unexpected error occured when formatting tron transaction"
    );
  }
};

export const txInfoToOperation = (
  id: string,
  address: string,
  tx: TrongridTxInfo
): ?Operation => {
  const {
    txID,
    date,
    from,
    to,
    type,
    value = BigNumber(0),
    fee = BigNumber(0)
  } = tx;
  const hash = txID;

  const operationType = getOperationType(tx, address);

  if (operationType) {
    return {
      id: `${id}-${hash}-${operationType}`,
      hash,
      type: operationType,
      value:
        operationType === "OUT" && type === "TransferContract"
          ? value.plus(fee)
          : value, // fee is not charged in TRC tokens
      fee: fee,
      blockHeight: 0,
      blockHash: null,
      accountId: id,
      senders: [from],
      recipients: to ? [to] : [],
      date,
      extra: {}
    };
  }

  return undefined;
};
