import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID, APTOS_FUNGIBLE_STORE, APTOS_OBJECT_CORE } from "../constants";
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
): { coin_id: string | null; amount_in: BigNumber; amount_out: BigNumber } {
  let coin_id: string | null = null;
  let amount_in = BigNumber(0);
  let amount_out = BigNumber(0);

  // collect all events related to the address and calculate the overall amounts
  tx.events.forEach(event => {
    switch (event.type) {
      case "0x1::coin::WithdrawEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coin_id = getResourceAddress(tx, event, "withdraw_events", getEventCoinAddress);
          amount_out = amount_out.plus(event.data.amount);
        }
        break;
      case "0x1::coin::DepositEvent":
        if (compareAddress(event.guid.account_address, address)) {
          coin_id = getResourceAddress(tx, event, "deposit_events", getEventCoinAddress);
          amount_in = amount_in.plus(event.data.amount);
        }
        break;
      case "0x1::fungible_asset::Withdraw":
        if (checkFAOwner(tx, event, address)) {
          coin_id = getResourceAddress(tx, event, "withdraw_events", getEventFAAddress);
          amount_out = amount_out.plus(event.data.amount);
        }
        break;
      case "0x1::fungible_asset::Deposit":
        if (checkFAOwner(tx, event, address)) {
          coin_id = getResourceAddress(tx, event, "deposit_events", getEventFAAddress);
          amount_in = amount_in.plus(event.data.amount);
        }
        break;
      case "0x1::transaction_fee::FeeStatement":
        if (tx.sender === address) {
          coin_id ??= APTOS_ASSET_ID;
          if (coin_id === APTOS_ASSET_ID) {
            const fees = BigNumber(tx.gas_unit_price).times(BigNumber(tx.gas_used));
            amount_out = amount_out.plus(fees);
          }
        }
        break;
    }
  });
  return { coin_id, amount_in, amount_out };
}
