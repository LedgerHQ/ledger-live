import {
  EntryFunctionPayloadResponse,
  Event,
  InputEntryFunctionData,
  MoveResource,
  WriteSetChange,
  WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account, Operation, OperationType, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import {
  APTOS_ASSET_ID,
  APTOS_FUNGIBLE_STORE,
  BATCH_TRANSFER_TYPES,
  DELEGATION_POOL_TYPES,
  DIRECTION,
  TRANSFER_TYPES,
} from "../constants";
import type {
  AptosFungibleStoreResourceData,
  AptosMoveResource,
  AptosTransaction,
  Transaction,
  TransactionOptions,
} from "../types";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets";

export const DEFAULT_GAS = new BigNumber(200);
export const DEFAULT_GAS_PRICE = new BigNumber(100);
export const ESTIMATE_GAS_MUL = new BigNumber(1.0); // define buffer for gas estimation change here, if needed

const CLEAN_HEX_REGEXP = /^0x0*|^0+/;

export function isTestnet(currencyId: string): boolean {
  return getCryptoCurrencyById(currencyId).isTestnetFor ? true : false;
}

export const getMaxSendBalance = (
  gas: BigNumber,
  gasPrice: BigNumber,
  account: Account,
  transaction?: Transaction,
): BigNumber => {
  const tokenAccount = findSubAccountById(account, transaction?.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);

  const totalGas = gas.multipliedBy(gasPrice);

  return fromTokenAccount
    ? tokenAccount.spendableBalance
    : account.spendableBalance.gt(totalGas)
      ? account.spendableBalance.minus(totalGas)
      : new BigNumber(0);
};

export function normalizeTransactionOptions(options: TransactionOptions): TransactionOptions {
  // FIXME: this is wrong. TransactionOptions is
  // {
  //     maxGasAmount: string;
  //     gasUnitPrice: string;
  //     sequenceNumber?: string;
  //     expirationTimestampSecs?: string;
  // }
  // meaning we can't return undefined in check method.
  // This method is useless, not deleting as it breaks code and this iteration is coin modularisation.
  const check = (v: any) => ((v ?? "").toString().trim() ? v : undefined);
  return {
    maxGasAmount: check(options.maxGasAmount),
    gasUnitPrice: check(options.gasUnitPrice),
  };
}

export const getBlankOperation = (
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
  extra: { version: tx.version },
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
): [Operation[], Operation[]] => {
  const { address } = info;
  const ops: Operation[] = [];
  const opsTokens: Operation[] = [];

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

      const { coin_id, amount_in, amount_out } = getCoinAndAmounts(tx, address);
      op.value = calculateAmount(tx.sender, address, op.fee, amount_in, amount_out);
      op.type = compareAddress(tx.sender, address) ? DIRECTION.OUT : DIRECTION.IN;
      op.senders.push(tx.sender);

      processRecipients(payload, address, op, function_address);

      if (op.value.isZero()) {
        // skip transaction that result no Aptos change
        op.type = DIRECTION.UNKNOWN;
      }

      op.hasFailed = !tx.success;

      if (op.type !== DIRECTION.UNKNOWN) {
        if (coin_id === null) {
          return;
        } else if (coin_id == APTOS_ASSET_ID) {
          op.id = encodeOperationId(id, tx.hash, op.type);
          ops.push(op); // if not aptos then should be tokens
        } else {
          const token = findTokenByAddressInCurrency(coin_id.toLowerCase(), "aptos");
          // skip tokens that are not in the CAL
          if (token != undefined) {
            op.accountId = encodeTokenAccountId(id, token);
            op.id = encodeOperationId(op.accountId, tx.hash, op.type);
            opsTokens.push(op);
          }
        }
      }
    }
  });

  return [ops, opsTokens];
};

export function compareAddress(addressA: string, addressB: string) {
  return (
    addressA.replace(CLEAN_HEX_REGEXP, "").toLowerCase() ===
    addressB.replace(CLEAN_HEX_REGEXP, "").toLowerCase()
  );
}

export function getFunctionAddress(payload: InputEntryFunctionData): string | undefined {
  if (payload.function) {
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
    payload.functionArguments.length > 0 &&
    typeof payload.functionArguments[0] === "string"
  ) {
    // 1. Transfer like functions (includes some delegation pool functions)
    op.recipients.push(payload.functionArguments[0].toString());
  } else if (
    BATCH_TRANSFER_TYPES.includes(payload.function) &&
    payload.functionArguments &&
    payload.functionArguments.length > 0 &&
    Array.isArray(payload.functionArguments[0])
  ) {
    // 2. Batch function, to validate we are in the recipients list
    if (!compareAddress(op.senders[0], address)) {
      for (const recipient of payload.functionArguments[0]) {
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

export function getEventCoinAddress(
  change: WriteSetChangeWriteResource,
  event: Event,
  event_name: string,
): string | null {
  const change_data = change.data;

  const mr = change_data as MoveResource<AptosMoveResource>; // -> this is data that we want to parse

  if (!(event_name in mr.data)) {
    return null;
  }

  const change_event_data = mr.data[event_name];
  if (
    change_event_data.guid.id.addr != event.guid.account_address ||
    change_event_data.guid.id.creation_num != event.guid.creation_number
  ) {
    return null;
  }

  const address = extractAddress(mr.type);

  return address;
}

export function getEventFAAddress(
  change: WriteSetChangeWriteResource,
  event: Event,
  _event_name: string,
): string | null {
  const change_data = change.data;

  if (change_data.type != APTOS_FUNGIBLE_STORE) {
    return null;
  }

  const mr = change_data as MoveResource<AptosFungibleStoreResourceData>;

  if (change.address != event.data.store) {
    return null;
  }

  return mr.data.metadata.inner;
}

export function getResourceAddress(
  tx: AptosTransaction,
  event: Event,
  event_name: string,
  getAddressProcessor: (
    change: WriteSetChangeWriteResource,
    event: Event,
    event_name: string,
  ) => string | null,
): string | null {
  for (const change of tx.changes) {
    if (isWriteSetChangeWriteResource(change)) {
      const address = getAddressProcessor(change, event, event_name);
      if (address !== null) {
        return address;
      }
    }
  }
  return null;
}

function isWriteSetChangeWriteResource(
  change: WriteSetChange,
): change is WriteSetChangeWriteResource {
  return (change as WriteSetChangeWriteResource).data !== undefined;
}

export function getCoinAndAmounts(
  tx: AptosTransaction,
  address: string,
): { coin_id: string | null; amount_in: BigNumber; amount_out: BigNumber } {
  let coin_id: string | null = null;
  let amount_in = new BigNumber(0);
  let amount_out = new BigNumber(0);

  // collect all events related to the address and calculate the overall amounts
  tx.events.forEach(event => {
    switch (event.type) {
      case "0x1::coin::WithdrawEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coin_id = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
          if (coin_id != null) {
            amount_out = amount_out.plus(event.data.amount);
          }
        }
        break;
      case "0x1::coin::DepositEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coin_id = getResourceAddress(tx, event, "deposit_events", getEventCoinAddress);
          if (coin_id != null) {
            amount_in = amount_in.plus(event.data.amount);
          }
          // TODO: check if we can have coin events during transferring FA
        }
        break;
      case "0x1::fungible_asset::Deposit":
        coin_id = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
        if (coin_id != null) {
          amount_in = amount_in.plus(event.data.amount);
        }
        break;
      case "0x1::fungible_asset::Withdraw":
        coin_id = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
        if (coin_id != null) {
          amount_in = amount_in.plus(event.data.amount);
        }
        break;
    }
  });
  return { coin_id, amount_in, amount_out }; // TODO: manage situation when there are several coinID from the events parsing
}

export function calculateAmount( // NO changes
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

/**
 * Extracts the address from a string like "0x1::coin::CoinStore<address::module::type>"
 * @param {string} str - The input string containing the address.
 * @returns {string | null} - The extracted address or null if not found.
 */
export function extractAddress(str: string): string | null {
  const match = str.match(/<([^>]+)>/);
  return match ? match[1] : null;
}

export function getTokenAccount(
  account: Account,
  transaction: Transaction,
): TokenAccount | undefined {
  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const fromTokenAccount = tokenAccount && isTokenAccount(tokenAccount);
  return fromTokenAccount ? tokenAccount : undefined;
}
