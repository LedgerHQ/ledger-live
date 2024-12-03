import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import BigNumber from "bignumber.js";

import type { Types as AptosTypes } from "aptos";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import type { AptosTransaction, Transaction } from "./types";
import { encodeOperationId } from "../../operation";

import {
  TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  BATCH_TRANSFER_TYPES,
  TX_TYPE,
  APTOS_OBJECT_TRANSFER,
  APTOS_DELEGATION_WITHDRAW,
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
      let function_address;
      if ("function" in payload) {
        type = payload.function.split("::").at(-1) as TX_TYPE;
        function_address = payload.function.split("::").at(0);
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
            op.value = op.value.plus(op.fee);
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
          op.value = op.value.plus(op.fee);
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
          op.value = op.value.plus(op.fee);
          op.recipients.push(function_address);
        } else {
          op.type = DIRECTION.IN;
          op.senders.push(function_address);
        }

        // GENERAL CASE`
        // get events
        let amount_in = new BigNumber(0);
        let amount_out = new BigNumber(0);
        console.log("Version:" + tx.version);
        tx.events.forEach(event => {
          // validate the event is related to the address
          if (compareAddress(event.guid.account_address, address)) {
            console.log("Found: " + JSON.stringify(event));

            // for valid event get corresponding change and validate it relates to Aptos Tokens
            // update amount according to the event type
            switch (event.type) {
              case "0x1::coin::WithdrawEvent":
                op.type = DIRECTION.OUT;
                if (IsChangeOfAptos(tx, op.type, id, address, event)) {
                  amount_out = op.value.plus(event.data.amount);
                }
                break;
              case "0x1::coin::DepositEvent":
                if (IsChangeOfAptos(tx, op.type, id, address, event)) {
                  amount_in = amount_in.plus(event.data.amount);
                }
                break;
              default:
                op.type = DIRECTION.UNKNOWN;
            }
          }
          if (amount_in.gt(amount_out)) {
            op.type = DIRECTION.IN;
            op.value = amount_in.minus(amount_out);
          } else {
            op.type = DIRECTION.OUT;
            op.value = amount_out.minus(amount_in);
          }

          ops.push(op);
        });
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

function IsChangeOfAptos(
  tx: AptosTransaction,
  direction: string, // TODO: convert to enum
  id: string,
  address: string,
  event: any, // TODO: make proper type
): boolean {
  return tx.changes.some(change => {
    if ("data" in change) {
      const data = change.data;
      if (data && "type" in data) {
        //console.log("Changes: " + JSON.stringify(data.type));
        if (data.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>") {
          let deposits;
          if ("deposit_events" in data.data) {
            deposits = data.data.deposit_events;
          }
          let withdraws;
          if ("withdraw_events" in data.data) {
            withdraws = data.data.withdraw_events;
          }
          const change_event = direction === DIRECTION.IN ? deposits : withdraws;
          // check events handlers
          console.log("Take: " + JSON.stringify(data));
          if (
            change_event &&
            change_event.guid.id.addr === event.guid.account_address &&
            change_event.guid.id.creation_num === event.guid.creation_number
          ) {
            console.log("FOUND: " + JSON.stringify(data));
            return true;
          }
        }
      }
    }
    return false;
  });
}
