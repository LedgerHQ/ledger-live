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
  account: Account,
  transaction: Transaction,
  gas: BigNumber,
  gasPrice: BigNumber,
): BigNumber => {
  const tokenAccount = findSubAccountById(account, transaction.subAccountId ?? "");
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
  // TODO: consider treating the APT ans the coin and don't make spatial return list for it
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

      const { coinID, amount_in, amount_out } = getCoinAmounts(tx, address); // to do get amount info for tokens
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

      if (op.type !== DIRECTION.UNKNOWN) {
        if (coinID === null) {
          return;
        } else if (coinID == APTOS_ASSET_ID) {
          ops.push(op); // if not aptos then should be tokens
        } else {
          const token = findTokenByAddressInCurrency(coinID.toLowerCase(), "aptos");
          if (token != undefined) {
            op.accountId = encodeTokenAccountId(id, token);
            op.id = encodeOperationId(op.accountId, tx.hash, op.type); // TODO: duplication line 134
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

function getEventCoinAddress(
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

  //"0x1::coin::CoinStore<0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT>"

  const address = extractAddress(mr.type);

  return address;
}

function getEventFAAddress(
  change: WriteSetChangeWriteResource,
  event: Event,
  _event_name: string,
): string | null {
  const change_data = change.data;

  if (change_data.type != "0x1::fungible_asset::FungibleStore") {
    return null;
  }

  const mr = change_data as MoveResource<AptosFungibleStoreResourceData>;

  if (change.address != event.data.store) {
    return null;
  }

  return mr.data.metadata.inner;
}

function getResourceAddress(
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

// export function isChangeOfAptos(
//   writeSetChange: WriteSetChange,
//   event: Event,
//   event_name: string,
// ): boolean {
//   // to validate the event is related to Aptos Tokens we need to find change of type "write_resource"
//   // with the same guid as event
//   if (writeSetChange.type !== WRITE_RESOURCE) {
//     return false;
//   }

//   if (!("data" in writeSetChange)) {
//     return false;
//   }

//   const change_data = writeSetChange.data;

//   if (!("type" in change_data)) {
//     return false;
//   }

//   const mr = change_data as MoveResource<AptosMoveResource>;
// }

function isWriteSetChangeWriteResource(
  change: WriteSetChange,
): change is WriteSetChangeWriteResource {
  return (change as WriteSetChangeWriteResource).data !== undefined;
}

export function getCoinAmounts( // TODO: nmae should be
  tx: AptosTransaction,
  address: string,
): { coinID: string | null; amount_in: BigNumber; amount_out: BigNumber } {
  let coinID: string | null = null;
  let amount_in = new BigNumber(0);
  let amount_out = new BigNumber(0);

  //TODO: check if it possible to have events for the different coins/FA in one transaction

  // return tx.changes.some(change => {
  //   return isChangeOfAptos(change, event, event_name);
  // });

  // collect all events related to the address and calculate the overall amounts
  tx.events.forEach(event => {
    switch (event.type) {
      // thoughts:
      // there can be different events in the transaction,
      // we need to define te events that are releated to the specific coin.
      // this means that for each event we need to find the tokenID
      // and sum up the amount that are related to the specific tokens
      // after thea we will be able to filter the transactions

      case "0x1::coin::WithdrawEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coinID = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
          amount_out = amount_out.plus(event.data.amount);
          // COIN
          // TODO: make change of coins
        }

        break;
      case "0x1::coin::DepositEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coinID = getResourceAddress(tx, event, "deposit_events", getEventCoinAddress);
          amount_in = amount_in.plus(event.data.amount);
          // COIN
          // TODO: make change of coins
          // TODO: check if we can transfer FA with coiin events
        }
        break;

      // FA
      case "0x1::fungible_asset::Deposit": // should support both coin and FA trasfers
        coinID = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
        amount_in = amount_in.plus(event.data.amount);

        break;
      case "0x1::fungible_asset::Withdraw":
        coinID = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
        amount_in = amount_in.plus(event.data.amount);
        break;
      // TODO: parse events for FA
      // TODO: make change of FA
    }
  });
  return { coinID, amount_in, amount_out }; // TOOD: manage situation when there are several coinID from the events parsing
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
