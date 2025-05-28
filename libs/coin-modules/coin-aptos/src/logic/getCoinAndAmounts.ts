import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID, APTOS_FUNGIBLE_STORE, APTOS_OBJECT_CORE, OP_TYPE } from "../constants";
import {
  AptosFungibleoObjectCoreResourceData,
  AptosFungibleStoreResourceData,
  AptosMoveResource,
  AptosTransaction,
} from "../types";
import { MoveResource, WriteSetChangeWriteResource, Event } from "@aptos-labs/ts-sdk";
import { getResourceAddress } from "./getResourceAddress";
import { isWriteSetChangeWriteResource } from "./isWriteSetChangeWriteResource";

const CLEAN_HEX_REGEXP = /^0x0*|^0+/;

export function compareAddress(addressA: string, addressB: string) {
  return (
    addressA.replace(CLEAN_HEX_REGEXP, "").toLowerCase() ===
    addressB.replace(CLEAN_HEX_REGEXP, "").toLowerCase()
  );
}

export function checkFAOwner(tx: AptosTransaction, event: Event, user_address: string): boolean {
  for (const change of tx.changes) {
    if (isWriteSetChangeWriteResource(change)) {
      const storeData = change.data as MoveResource<AptosFungibleoObjectCoreResourceData>;
      if (
        change.address == event.data.store &&
        storeData.type == APTOS_OBJECT_CORE &&
        storeData.data.owner == user_address
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Extracts the address from a string like "0x1::coin::CoinStore<address::module::type>"
 * @param {string} str - The input string containing the address.
 * @returns {string | null} - The extracted address or null if not found.
 */
function extractAddress(str: string): string | null {
  const match = /<([^<>]+)>$/.exec(str);
  return match ? match[1] : null;
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
    change_event_data.guid.id.addr !== event.guid.account_address ||
    change_event_data.guid.id.creation_num !== event.guid.creation_number
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

  if (change_data.type !== APTOS_FUNGIBLE_STORE) {
    return null;
  }

  const mr = change_data as MoveResource<AptosFungibleStoreResourceData>;

  if (change.address !== event.data.store) {
    return null;
  }

  return mr.data.metadata.inner;
}

export function getCoinAndAmounts(
  tx: AptosTransaction,
  address: string,
): {
  coin_id: string | null;
  amount_in: BigNumber;
  amount_out: BigNumber;
  type: OP_TYPE;
} {
  let coin_id: string | null = null;
  let amount_in = BigNumber(0);
  let amount_out = BigNumber(0);
  let type = OP_TYPE.UNKNOWN;

  // Check if it is a staking transaction
  const stakingTx = !!tx.events.find(
    event =>
      event.type === "0x1::stake::AddStakeEvent" ||
      event.type === "0x1::stake::ReactivateStakeEvent" ||
      event.type === "0x1::stake::UnlockStakeEvent" ||
      event.type === "0x1::stake::WithdrawStakeEvent" ||
      event.type === "0x1::delegation_pool::AddStakeEvent" ||
      event.type === "0x1::delegation_pool::ReactivateStakeEvent" ||
      event.type === "0x1::delegation_pool::UnlockStakeEvent" ||
      event.type === "0x1::delegation_pool::WithdrawStakeEvent",
  );

  // Collect all events related to the address and calculate the overall amounts
  if (stakingTx) {
    tx.events.forEach(event => {
      if (
        (event.type === "0x1::stake::AddStakeEvent" ||
          event.type === "0x1::delegation_pool::AddStakeEvent") &&
        tx.sender === address &&
        !amount_out.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.STAKE;
        amount_out = amount_out.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::ReactivateStakeEvent" ||
          event.type === "0x1::delegation_pool::ReactivateStakeEvent") &&
        tx.sender === address &&
        !amount_out.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.STAKE;
        amount_out = amount_out.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::UnlockStakeEvent" ||
          event.type === "0x1::delegation_pool::UnlockStakeEvent") &&
        tx.sender === address &&
        !amount_in.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.UNSTAKE;
        amount_in = amount_in.plus(event.data.amount_added);
      } else if (
        (event.type === "0x1::stake::WithdrawStakeEvent" ||
          event.type === "0x1::delegation_pool::WithdrawStakeEvent") &&
        tx.sender === address &&
        !amount_in.gt(BigNumber(0))
      ) {
        coin_id = APTOS_ASSET_ID;
        type = OP_TYPE.WITHDRAW;
        amount_in = amount_in.plus(event.data.amount_withdrawn);
      }
    });
  } else {
    tx.events.forEach(event => {
      if (
        event.type === "0x1::coin::WithdrawEvent" &&
        compareAddress(event.guid.account_address, address)
      ) {
        coin_id = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
        amount_out = amount_out.plus(event.data.amount);
      } else if (
        event.type === "0x1::coin::DepositEvent" &&
        compareAddress(event.guid.account_address, address)
      ) {
        coin_id = getResourceAddress(tx, event, "deposit_events", getEventCoinAddress);
        amount_in = amount_in.plus(event.data.amount);
      } else if (
        event.type === "0x1::fungible_asset::Withdraw" &&
        checkFAOwner(tx, event, address)
      ) {
        coin_id = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
        amount_out = amount_out.plus(event.data.amount);
      } else if (
        event.type === "0x1::fungible_asset::Deposit" &&
        checkFAOwner(tx, event, address)
      ) {
        coin_id = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
        amount_in = amount_in.plus(event.data.amount);
      } else if (event.type === "0x1::transaction_fee::FeeStatement" && tx.sender === address) {
        if (coin_id === null) coin_id = APTOS_ASSET_ID;
        if (coin_id === APTOS_ASSET_ID) {
          const fees = BigNumber(tx.gas_unit_price).times(BigNumber(tx.gas_used));
          amount_out = amount_out.plus(fees);
        }
      }
    });
  }

  return { coin_id, amount_in, amount_out, type };
}
