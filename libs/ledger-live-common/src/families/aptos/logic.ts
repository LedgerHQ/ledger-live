import {
  EntryFunctionPayloadResponse,
  Event,
  InputEntryFunctionData,
  WriteSetChange,
  WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "../../operation";
import {
  APTOS_COIN_CHANGE,
  BATCH_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  DIRECTION,
  TRANSFER_TYPES,
} from "./constants";
import type { AptosTransaction, Transaction } from "./types";

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

const convertFunctionPayloadResponseToInputEntryFunctionData = (
  payload: EntryFunctionPayloadResponse,
): InputEntryFunctionData => ({
  function: payload.function,
  typeArguments: payload.type_arguments,
  functionArguments: payload.arguments,
});

export const txsToOps = (
  info: { address: string },
  id: string,
  txs: (AptosTransaction | null)[],
): Operation[] => {
  const { address } = info;
  const ops: Operation[] = [];

  txs.forEach(tx => {
    if (tx !== null) {
      const op: Operation = getBlankOperation(tx, id);
      op.fee = new BigNumber(tx.gas_used).multipliedBy(new BigNumber(tx.gas_unit_price));

      const payload = convertFunctionPayloadResponseToInputEntryFunctionData(
        tx.payload as EntryFunctionPayloadResponse,
      );

      const function_address = getFunctionAddress(payload);

      if (!function_address) {
        return; // skip transaction without functions in payload
      }

      const { amount_in, amount_out } = getAptosAmounts(tx, address);
      op.value = calculateAmount(tx.sender, address, op.fee, amount_in, amount_out);
      op.type = compareAddress(tx.sender, address) ? DIRECTION.OUT : DIRECTION.IN;
      op.senders.push(tx.sender);

      processRecipients(payload, address, op, function_address);

      if (op.value.isZero()) {
        // skip transaction that result no Aptos change
        op.type = DIRECTION.UNKNOWN;
      }

      op.hasFailed = !tx.success;
      op.id = encodeOperationId(id, tx.hash, op.type);
      if (op.type !== DIRECTION.UNKNOWN) ops.push(op);
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

export function getFunctionAddress(payload: InputEntryFunctionData): string | undefined {
  if ("function" in payload) {
    const parts = payload.function.split("::");
    return parts.length === 3 && parts[0].length ? parts[0] : undefined;
  }
  return undefined;
}

export function processRecipients(
  payload: InputEntryFunctionData,
  address: string,
  op: Operation,
  function_address: string,
): void {
  // get recipients buy 3 groups
  if (
    (TRANSFER_TYPES.includes(payload.function) ||
      DELEGATION_POOL_TYPES.includes(payload.function)) &&
    payload.functionArguments &&
    payload.functionArguments.length > 1 &&
    typeof payload.functionArguments[1] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[1].toString());
  } else if (
    BATCH_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 1 &&
    Array.isArray(payload.functionArguments[1])
  ) {
    // 2. Batch function, to validate we are in the recipients list
    if (!compareAddress(op.senders[0], address)) {
      for (const recipient of payload.functionArguments[1]) {
        if (recipient && compareAddress(recipient.toString(), address)) {
          op.recipients.push(recipient.toString());
        }
      }
    }
  } else {
    // 3. other smart contracts, in this case smart contract will be treated as a recipient
    op.recipients.push(function_address);
  }
}

function checkWriteSets(tx: AptosTransaction, event: Event, event_name: string): boolean {
  return tx.changes.some(change => {
    return isChangeOfAptos(change, event, event_name);
  });
}

export function isChangeOfAptos(change: WriteSetChange, event: Event, event_name: string): boolean {
  // to validate the event is related to Aptos Tokens we need to find change of type "write_resource"
  // with the same guid as event
  if (change.type == "write_resource") {
    const change_data = (change as WriteSetChangeWriteResource).data;
    if (change_data.type === APTOS_COIN_CHANGE) {
      const change_event_data = change_data.data[event_name];
      if (
        change_event_data &&
        change_event_data.guid.id.addr === event.guid.account_address &&
        change_event_data.guid.id.creation_num === event.guid.creation_number
      ) {
        return true;
      }
    }
  }
  return false;
}

export function getAptosAmounts(
  tx: AptosTransaction,
  address: string,
): { amount_in: BigNumber; amount_out: BigNumber } {
  let amount_in = new BigNumber(0);
  let amount_out = new BigNumber(0);
  // collect all events related to the address and calculate the overall amounts
  tx.events.forEach(event => {
    if (compareAddress(event.guid.account_address, address)) {
      switch (event.type) {
        case "0x1::coin::WithdrawEvent":
          if (checkWriteSets(tx, event, "withdraw_events")) {
            amount_out = amount_out.plus(event.data.amount);
          }
          break;
        case "0x1::coin::DepositEvent":
          if (checkWriteSets(tx, event, "deposit_events")) {
            amount_in = amount_in.plus(event.data.amount);
          }
          break;
      }
    }
  });
  return { amount_in, amount_out };
}

export function calculateAmount(
  sender: string,
  address: string,
  fee: BigNumber,
  amount_in: BigNumber,
  amount_out: BigNumber,
): BigNumber {
  const is_sender: boolean = compareAddress(sender, address);
  // Include fees if our address is the sender
  if (is_sender) {
    amount_out = amount_out.plus(fee);
  }
  // LL negates the amount for SEND transactions
  // to show positive amount on the send transaction (ex: in "cancel" tx, when amount will be returned to our account)
  // we need to make it negative
  return is_sender ? amount_out.minus(amount_in) : amount_in.minus(amount_out);
}
