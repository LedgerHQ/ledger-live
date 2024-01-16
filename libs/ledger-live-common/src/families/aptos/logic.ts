import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";

import type { Types as AptosTypes } from "aptos";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { AptosTransaction, Transaction } from "./types";
import { encodeOperationId } from "../../operation";

import {
  TRANSFER_TYPES,
  TX_TYPE,
  APTOS_OBJECT_TRANSFER,
  APTOS_TRANSFER_FUNCTION_ADDRESS,
  DIRECTION,
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

      const payload = tx.payload as AptosTypes.EntryFunctionPayload;

      let type;
      if ("function" in payload) {
        type = payload.function.split("::").at(-1) as TX_TYPE;
      } else if ("type" in payload) {
        type = (payload as any).type as TX_TYPE;
      }

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
        if (op.type !== DIRECTION.UNKNOWN) ops.push(op);
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
