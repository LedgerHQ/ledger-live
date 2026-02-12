import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { Address, Cell } from "@ton/core";
import BigNumber from "bignumber.js";
import type {
  TonPayloadChangeDnsRecord,
  TonPayloadChangeDnsRecordRaw,
  TonPayloadFormat,
  TonPayloadFormatRaw,
  Transaction,
  TransactionRaw,
} from "./types";

export const formatTransaction = (
  { recipient, useAllAmount, amount }: Transaction,
  account: Account,
): string => `
SEND ${
  useAllAmount
    ? "MAX"
    : amount.isZero()
      ? ""
      : " " +
        formatCurrencyUnit(getAccountCurrency(account).units[0], amount, {
          showCode: true,
          disableRounding: true,
        })
}
TO ${recipient}`;

const getCellOrBuffer = (customPayload: string | null): Cell | Buffer | null => {
  if (!customPayload) return null;

  try {
    return Cell.fromBase64(customPayload);
  } catch {
    return Buffer.from(customPayload, "hex");
  }
};

const safeToBigInt = (value: string | null): bigint | null => {
  return value ? BigInt(value) : null;
};

const safeCellFromBase64 = (value: string | null): Cell | null => {
  return value ? Cell.fromBase64(value) : null;
};

const fromRecordRaw = (
  record: TonPayloadChangeDnsRecordRaw["record"],
): TonPayloadChangeDnsRecord["record"] => {
  if (record.type === "wallet") {
    return {
      type: record.type,
      value: record.value
        ? {
            address: Address.parse(record.value.address),
            capabilities: record.value.capabilities,
          }
        : null,
    };
  }

  return {
    type: record.type,
    key: Buffer.from(record.key, "hex"),
    value: safeCellFromBase64(record.value),
  };
};

const fromTransactionPayloadRaw = (payload: TonPayloadFormatRaw): TonPayloadFormat => {
  switch (payload.type) {
    case "unsafe":
      return {
        type: payload.type,
        message: Cell.fromBase64(payload.message),
      };
    case "jetton-transfer":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        amount: BigInt(payload.amount),
        destination: Address.parse(payload.destination),
        responseDestination: Address.parse(payload.responseDestination),
        customPayload: safeCellFromBase64(payload.customPayload),
        forwardAmount: BigInt(payload.forwardAmount),
        forwardPayload: safeCellFromBase64(payload.forwardPayload),
        knownJetton: payload.knownJetton,
      };
    case "nft-transfer":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        newOwner: Address.parse(payload.newOwner),
        responseDestination: Address.parse(payload.responseDestination),
        customPayload: safeCellFromBase64(payload.customPayload),
        forwardAmount: BigInt(payload.forwardAmount),
        forwardPayload: safeCellFromBase64(payload.forwardPayload),
      };
    case "jetton-burn":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        amount: BigInt(payload.amount),
        responseDestination: Address.parse(payload.responseDestination),
        customPayload: getCellOrBuffer(payload.customPayload),
      };
    case "add-whitelist":
    case "single-nominator-change-validator":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        address: Address.parse(payload.address),
      };
    case "single-nominator-withdraw":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        amount: BigInt(payload.amount),
      };
    case "tonstakers-deposit":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        appId: safeToBigInt(payload.appId),
      };
    case "vote-for-proposal":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        votingAddress: Address.parse(payload.votingAddress),
        expirationDate: payload.expirationDate,
        vote: payload.vote,
        needConfirmation: payload.needConfirmation,
      };
    case "change-dns-record":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        record: fromRecordRaw(payload.record),
      };
    case "token-bridge-pay-swap":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        swapId: Buffer.from(payload.swapId, "hex"),
      };
    case "tonwhales-pool-deposit":
      return {
        type: payload.type,
        queryId: BigInt(payload.queryId),
        gasLimit: BigInt(payload.gasLimit),
      };
    case "tonwhales-pool-withdraw":
      return {
        type: payload.type,
        queryId: BigInt(payload.queryId),
        gasLimit: BigInt(payload.gasLimit),
        amount: BigInt(payload.amount),
      };
    case "vesting-send-msg-comment":
      return {
        type: payload.type,
        queryId: safeToBigInt(payload.queryId),
        sendMode: payload.sendMode,
        value: BigInt(payload.value),
        destination: Address.parse(payload.destination),
        text: payload.text,
      };
    case "comment":
      return payload;
    default: {
      const exhaustiveCheck: never = payload; // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      return exhaustiveCheck;
    }
  }
};

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);

  return {
    ...common,
    family: tr.family,
    fees: new BigNumber(tr.fees),
    comment: tr.comment,
    payload: tr.payload ? fromTransactionPayloadRaw(tr.payload) : undefined,
  };
};

const safeFromBigInt = (value: bigint | null): string | null => {
  return typeof value === "bigint" ? value.toString() : null;
};

const safeBocToString = (value: Cell | null): string | null => {
  return value ? value.toBoc().toString("base64") : null;
};

const safeBocOrBufferToString = (value: Cell | Buffer | null): string | null => {
  if (value && "toBoc" in value) {
    return value.toBoc().toString("base64");
  }

  return value ? value.toString("hex") : null;
};

const fromRecord = (
  record: TonPayloadChangeDnsRecord["record"],
): TonPayloadChangeDnsRecordRaw["record"] => {
  if (record.type === "wallet") {
    return {
      type: record.type,
      value: record.value
        ? {
            address: record.value.address.toRawString(),
            capabilities: record.value.capabilities,
          }
        : null,
    };
  }

  return {
    type: record.type,
    key: record.key.toString("hex"),
    value: safeBocToString(record.value),
  };
};

const toTransactionPayloadRaw = (payload: TonPayloadFormat): TonPayloadFormatRaw => {
  switch (payload.type) {
    case "unsafe":
      return {
        type: payload.type,
        message: payload.message.toBoc().toString("base64"),
      };
    case "jetton-transfer":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        amount: payload.amount.toString(),
        destination: payload.destination.toRawString(),
        responseDestination: payload.responseDestination.toRawString(),
        customPayload: safeBocToString(payload.customPayload),
        forwardAmount: payload.forwardAmount.toString(),
        forwardPayload: safeBocToString(payload.forwardPayload),
        knownJetton: payload.knownJetton,
      };
    case "nft-transfer":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        newOwner: payload.newOwner.toRawString(),
        responseDestination: payload.responseDestination.toRawString(),
        customPayload: safeBocToString(payload.customPayload),
        forwardAmount: payload.forwardAmount.toString(),
        forwardPayload: safeBocToString(payload.forwardPayload),
      };
    case "jetton-burn":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        amount: payload.amount.toString(),
        responseDestination: payload.responseDestination.toRawString(),
        customPayload: safeBocOrBufferToString(payload.customPayload),
      };
    case "add-whitelist":
    case "single-nominator-change-validator":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        address: payload.address.toRawString(),
      };
    case "single-nominator-withdraw":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        amount: payload.amount.toString(),
      };
    case "tonstakers-deposit":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        appId: safeFromBigInt(payload.appId),
      };
    case "vote-for-proposal":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        votingAddress: payload.votingAddress.toRawString(),
        expirationDate: payload.expirationDate,
        vote: payload.vote,
        needConfirmation: payload.needConfirmation,
      };
    case "change-dns-record":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        record: fromRecord(payload.record),
      };
    case "token-bridge-pay-swap":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        swapId: payload.swapId.toString("hex"),
      };
    case "tonwhales-pool-deposit":
      return {
        type: payload.type,
        queryId: payload.queryId.toString(),
        gasLimit: payload.gasLimit.toString(),
      };
    case "tonwhales-pool-withdraw":
      return {
        type: payload.type,
        queryId: payload.queryId.toString(),
        gasLimit: payload.gasLimit.toString(),
        amount: payload.amount.toString(),
      };
    case "vesting-send-msg-comment":
      return {
        type: payload.type,
        queryId: safeFromBigInt(payload.queryId),
        sendMode: payload.sendMode,
        value: payload.value.toString(),
        destination: payload.destination.toRawString(),
        text: payload.text,
      };
    case "comment":
      return payload;
    default: {
      const exhaustiveCheck: never = payload; // https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking
      return exhaustiveCheck;
    }
  }
};

export const toTransactionRaw = (transaction: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(transaction);

  return {
    ...common,
    family: transaction.family,
    amount: transaction.amount.toFixed(),
    fees: transaction.fees.toFixed(),
    comment: transaction.comment,
    payload: transaction.payload ? toTransactionPayloadRaw(transaction.payload) : undefined,
  };
};

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
