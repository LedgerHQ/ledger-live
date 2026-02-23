import { createHash } from "crypto";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account, Operation, OperationType } from "@ledgerhq/types-live";
import type {
  Operation as AlpacaOperation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { decodeOperationId, encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import aleoConfig, { type AleoCoinConfig } from "../config";
import { EXPLORER_TRANSFER_TYPES, TRANSACTION_TYPE } from "../constants";
import type {
  AleoOperation,
  AleoTransactionType,
  EnrichedTransaction,
  TransactionType,
} from "../types";

export function parseMicrocredits(microcreditsU64: string): string {
  const value = microcreditsU64.split(".")[0];
  const expectedSuffix = "u64";
  const hasValidSuffix = value.endsWith(expectedSuffix);
  invariant(hasValidSuffix, `aleo: invalid microcredits format (${microcreditsU64})`);
  return value.replace(expectedSuffix, "");
}

export function getNetworkConfig(currency: CryptoCurrency) {
  const config = aleoConfig.getCoinConfig(currency);

  return {
    nodeUrl: config.apiUrls.node,
    sdkUrl: config.apiUrls.sdk,
    networkType: config.networkType,
  };
}

export function patchAccountWithViewKey(account: Account, viewKey: string): Account {
  invariant(viewKey, `aleo: viewKey is missing in patchAccountWithViewKey ${account.freshAddress}`);
  const accountIdParams = decodeAccountId(account.id);
  const updatedAccountId = encodeAccountId({
    ...accountIdParams,
    customData: viewKey,
  });

  const updateOperations = (ops: Operation[]) =>
    ops.map(op => {
      const { hash, type } = decodeOperationId(op.id);
      const updatedOperationId = encodeOperationId(updatedAccountId, hash, type);

      return {
        ...op,
        id: updatedOperationId,
        accountId: updatedAccountId,
      };
    });

  return {
    ...account,
    id: updatedAccountId,
    operations: updateOperations(account.operations),
    pendingOperations: updateOperations(account.pendingOperations),
  };
}

export const determineTransactionType = (
  functionId: string,
  operationType: OperationType,
): AleoTransactionType => {
  if (functionId === EXPLORER_TRANSFER_TYPES.PRIVATE) return "private";
  if (functionId === EXPLORER_TRANSFER_TYPES.PUBLIC) return "public";

  if (operationType === "IN") {
    if (functionId.endsWith("to_private")) return "private";
    if (functionId.endsWith("to_public")) return "public";
  }

  if (operationType === "OUT") {
    if (functionId.startsWith("transfer_private")) return "private";
    if (functionId.startsWith("transfer_public")) return "public";
  }

  return "public";
};

function parseTransactionFields(enrichedTx: EnrichedTransaction, address: string) {
  const date = new Date(Number(enrichedTx.rawTx.block_timestamp) * 1000);
  const hasFailed = enrichedTx.rawTx.transaction_status !== "Accepted";
  let type: OperationType = "NONE";
  let fee = 0;
  let blockHash = "";

  if (enrichedTx.details) {
    type = address === enrichedTx.rawTx.recipient_address ? "IN" : "OUT";
    fee = enrichedTx.details.fee_value;
    blockHash = enrichedTx.details.block_hash;
  }

  const transactionType = determineTransactionType(enrichedTx.rawTx.function_id, type);

  return { type, fee, blockHash, transactionType, date, hasFailed };
}

export const toAlpacaOperation = (
  enrichedTx: EnrichedTransaction,
  address: string,
): AlpacaOperation => {
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    enrichedTx,
    address,
  );

  return {
    id: enrichedTx.rawTx.transaction_id,
    type,
    recipients: [enrichedTx.rawTx.recipient_address],
    senders: [enrichedTx.rawTx.sender_address],
    value: BigInt(enrichedTx.rawTx.amount.toFixed(0)),
    asset: { type: "native" },
    details: {
      functionId: enrichedTx.rawTx.function_id,
      transactionType,
      ledgerOpType: type,
    },
    tx: {
      hash: enrichedTx.rawTx.transaction_id,
      fees: BigInt(fee.toFixed(0)),
      date: date,
      block: {
        hash: blockHash,
        height: enrichedTx.rawTx.block_number,
        time: date,
      },
      failed: hasFailed ?? false,
    },
  };
};

export const toBridgeOperation = (
  ledgerAccountId: string,
  enrichedTx: EnrichedTransaction,
  address: string,
): AleoOperation => {
  const { type, fee, blockHash, transactionType, date, hasFailed } = parseTransactionFields(
    enrichedTx,
    address,
  );

  return {
    id: encodeOperationId(ledgerAccountId, enrichedTx.rawTx.transaction_id, type),
    recipients: [enrichedTx.rawTx.recipient_address],
    senders: [enrichedTx.rawTx.sender_address],
    value: new BigNumber(enrichedTx.rawTx.amount),
    type,
    hasFailed,
    hash: enrichedTx.rawTx.transaction_id,
    fee: new BigNumber(fee),
    blockHeight: enrichedTx.rawTx.block_number,
    blockHash,
    accountId: ledgerAccountId,
    date,
    extra: {
      functionId: enrichedTx.rawTx.function_id,
      transactionType,
    },
  };
};

export const generateUniqueUsername = (address: string): string => {
  const timestamp = Date.now().toString();
  const combined = `${timestamp}_${address}`;
  const hash = createHash("sha256").update(combined).digest("hex");
  return hash;
};

export function resolveConfig(configOrCurrencyId: AleoCoinConfig | string): AleoCoinConfig {
  if (typeof configOrCurrencyId === "string") {
    const currency = getCryptoCurrencyById(configOrCurrencyId);
    const config = aleoConfig.getCoinConfig(currency);
    return config;
  }

  return configOrCurrencyId;
}

export function getTransactionType(intent: TransactionIntent): TransactionType {
  const allowedTransactionTypes = Object.values(TRANSACTION_TYPE);
  const transactionType = allowedTransactionTypes.find(v => intent.type === v);
  invariant(transactionType, `aleo: unsupported transaction intent type: ${intent.type}`);

  return transactionType;
}
