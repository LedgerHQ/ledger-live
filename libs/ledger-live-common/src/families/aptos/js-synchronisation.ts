import BigNumber from "bignumber.js";
import type { Types as AptosTypes } from "aptos";
import type { Operation, OperationType, Account } from "@ledgerhq/types-live";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import type { AptosTransaction } from "./types";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { encodeAccountId } from "../../account";
import { encodeOperationId } from "../../operation";

import { AptosAPI } from "./api";
import {
  TRANSFER_TYPES,
  TX_TYPE,
  APTOS_OBJECT_TRANSFER,
  APTOS_TRANSFER_FUNCTION_ADDRESS,
  DIRECTION,
} from "./constants";
import { compareAddress } from "./utils";

const getBlankOperation = (
  tx: AptosTransaction,
  id: string,
): Operation<Record<string, string>> => ({
  id: "",
  hash: tx.hash,
  type: "" as OperationType,
  value: new BigNumber(0),
  fee: new BigNumber(0),
  blockHash: tx.block?.hash,
  blockHeight: tx.block?.height,
  senders: [] as string[],
  recipients: [] as string[],
  accountId: id,
  date: new Date(parseInt(tx.timestamp) / 1000),
  extra: { version: tx?.version },
  transactionSequenceNumber: parseInt(tx.sequence_number),
  hasFailed: false,
});

const txsToOps = (info: any, id: string, txs: (AptosTransaction | null)[]) => {
  const { address } = info;
  const ops: Operation[] = [];
  txs.forEach(tx => {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(BigNumber(tx.gas_unit_price));

      const payload = tx.payload as AptosTypes.EntryFunctionPayload;

      let type;
      if ("function" in payload) {
        type = payload.function.split("::").at(-1) as TX_TYPE;
        (op.extra as any).entryFunction = payload.function.slice(
          payload.function.indexOf("::") + 2,
        );
      } else if ("type" in payload) {
        type = (payload as any).type as TX_TYPE;
      }
      (op.extra as any).entryFunction = type;

      // TRANSFER & RECEIVE
      if (TRANSFER_TYPES.includes(type) && "arguments" in payload) {
        // avoid v2 parse
        if ("function" in payload && payload.function === APTOS_OBJECT_TRANSFER) {
          op.type = DIRECTION.UNKNOWN;
        } else {
          op.recipients.push(payload.arguments[0]);
          op.senders.push(tx.sender);
          op.value = op.value.plus(payload.arguments[1]);
          if (compareAddress(op.recipients[0], address)) {
            op.type = DIRECTION.IN;
          } else {
            op.type = DIRECTION.OUT;
          }
        }

        if (
          !payload.type_arguments[0] &&
          "function" in payload &&
          payload.function !== APTOS_TRANSFER_FUNCTION_ADDRESS
        ) {
          op.type = DIRECTION.UNKNOWN;
        }

        op.hasFailed = !tx.success;
        op.id = encodeOperationId(id, tx.hash, op.type);
        ops.push(op);
      }
    }
  });
  return ops;
};

const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, derivationMode, currency } = info;

  const oldOperations = initialAccount?.operations || [];
  const startAt = (oldOperations[0]?.extra as any)?.version;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const aptosClient = new AptosAPI(currency.id);
  const { balance, transactions, blockHeight } = await aptosClient.getAccountInfo(address, startAt);

  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<Account> = {
    type: "Account",
    id: accountId,
    balance: balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
  };

  return shape;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape, shouldMergeOps: false });
