import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "../../operation";
import type { AptosTransaction, Transaction } from "./types";

import {
  APTOS_DELEGATION_WITHDRAW,
  APTOS_OBJECT_TRANSFER,
  BATCH_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  DIRECTION,
  TRANSFER_TYPES,
  TX_TYPE,
} from "./constants";

export const DEFAULT_GAS = 5;
export const DEFAULT_GAS_PRICE = 100;
export const ESTIMATE_GAS_MUL = 1.2;

const HEX_REGEXP = /^[-+]?[a-f0-9]+\.?[a-f0-9]*?$/i;
const CLEAN_HEX_REGEXP = /^0x0*|^0+/;

const LENGTH_WITH_0x = 66;

export function isValidAddress(address = ""): boolean {
  let str = address;

  const validAddressWithOx = address.startsWith("0x") && address.length === LENGTH_WITH_0x;

  if (!validAddressWithOx) return false;

  str = str.substring(2);

  return isValidHex(str);
}

function isValidHex(hex: string): boolean {
  return HEX_REGEXP.test(hex);
}

export function isTestnet(currencyId: string): boolean {
  return getCryptoCurrencyById(currencyId).isTestnetFor ? true : false;
}

export const getMaxSendBalance = (amount: BigNumber): BigNumber => {
  const gas = new BigNumber(DEFAULT_GAS + 2000);
  const gasPrice = new BigNumber(DEFAULT_GAS_PRICE);
  const totalGas = gas.multipliedBy(gasPrice);

  if (amount.gt(totalGas)) return amount.minus(totalGas);
  return amount;
};

export function normalizeTransactionOptions(
  options: Transaction["options"],
): Transaction["options"] {
  const check = (v: any) => {
    if (v === undefined || v === null || v === "") {
      return undefined;
    }
    return v;
  };

  return {
    maxGasAmount: check(options.maxGasAmount),
    gasUnitPrice: check(options.gasUnitPrice),
    sequenceNumber: check(options.sequenceNumber),
    expirationTimestampSecs: check(options.expirationTimestampSecs),
  };
}

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

export const txsToOps = (info: any, id: string, txs: (AptosTransaction | null)[]) => {
  const { address } = info;
  const ops: Operation[] = [];
  txs.forEach(tx => {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(BigNumber(tx.gas_unit_price));

      const payload = tx.payload;

      let type;
      if ("function" in payload) {
        type = payload.function.split("::").at(-1) as TX_TYPE;
      } else if ("type" in payload) {
        type = (payload as any).type as TX_TYPE;
      }

      // TRANSFER & RECEIVE
      if (
        (TRANSFER_TYPES.includes(type) || DELEGATION_POOL_TYPES.includes(type)) &&
        "arguments" in payload
      ) {
        // main DELEGATION_POOL functions have identic semantic to TRANSFER_TYPES so we can parse them in the same way
        // avoid v2 parse
        if ("function" in payload && payload.function === APTOS_OBJECT_TRANSFER) {
          op.type = DIRECTION.UNKNOWN;
        } else {
          if ("function" in payload && payload.function === APTOS_DELEGATION_WITHDRAW) {
            // for withdraw function signer should be recipient of the coins
            op.recipients.push(tx.sender);
            op.senders.push(payload.arguments[0]);
          } else {
            op.recipients.push(payload.arguments[0]);
            op.senders.push(tx.sender);
          }
          op.value = op.value.plus(payload.arguments[1]);
          if (compareAddress(op.recipients[0], address)) {
            op.type = DIRECTION.IN;
          } else {
            op.type = DIRECTION.OUT;
          }
        }

        op.hasFailed = !tx.success;
        op.id = encodeOperationId(id, tx.hash, op.type);
        if (op.type !== DIRECTION.UNKNOWN) ops.push(op);
      } else if (BATCH_TRANSFER_TYPES.includes(type) && "arguments" in payload) {
        // batch transfers has a list of recipients so we need to find `our` record to show
        op.senders.push(tx.sender);

        op.type = DIRECTION.UNKNOWN;
        if (compareAddress(tx.sender, address)) {
          op.type = DIRECTION.OUT;
          for (const amount of payload.arguments[1]) {
            op.value = op.value.plus(amount);
          }
        } else {
          for (const recipient_num in payload.arguments[0]) {
            if (compareAddress(payload.arguments[0][recipient_num], address)) {
              op.recipients.push(payload.arguments[0][recipient_num]);
              op.value = op.value.plus(payload.arguments[1][recipient_num]);
              op.type = DIRECTION.IN;
            }
          }
        }
        op.hasFailed = !tx.success;
        op.id = encodeOperationId(id, tx.hash, op.type);
        if (op.type !== DIRECTION.UNKNOWN) ops.push(op);
      } else {
        // This is the place where we want to process events
        // TODO: implement generig parsing of events
        op.type = DIRECTION.UNKNOWN;
        op.id = encodeOperationId(id, tx.hash, op.type);

        if (compareAddress(tx.sender, address)) {
          op.type = DIRECTION.OUT;
        } else {
          op.type = DIRECTION.IN;
        }
        ops.push(op);
      }
    }
  });
  return ops;
};

export function compareAddress(addressA: string, addressB: string) {
  return (
    addressA.replace(CLEAN_HEX_REGEXP, "").toLowerCase() ===
    addressB.replace(CLEAN_HEX_REGEXP, "").toLowerCase()
  );
}
