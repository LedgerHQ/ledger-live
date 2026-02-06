import { BigNumber } from "bignumber.js";
import { getAddressesActive, getBalancesForAddresses } from "../network";
import { AccountAddress, AccountAddresses } from "../types";
import KaspaBIP32 from "./bip32";

// Constants to improve clarity
const RECEIVE_ADDRESS_TYPE = 0;
const CHANGE_ADDRESS_TYPE = 1;
const INITIAL_BALANCE = BigNumber(0);
const GAP_LIMIT = 20;
const SCAN_BATCH_SIZE = 200;

/**
 * Scans the addresses for an account and retrieves information such as used addresses and the total balance.
 *
 * @param {Buffer} compressedPublicKey - The compressed public key used for address derivation.
 * @param {Buffer} chainCode - The chain code used for address derivation.
 * @param {number} [startIndex=0] - The starting index for address scanning.
 * @return {Promise<AccountAddresses>} - A promise that resolves to an AccountAddresses object containing used addresses and balance information.
 */
export async function scanAddresses(
  compressedPublicKey: Buffer,
  chainCode: Buffer,
  startIndex: number,
): Promise<AccountAddresses> {
  const kaspaBip32: KaspaBIP32 = new KaspaBIP32(compressedPublicKey, chainCode);

  const accountAddresses: AccountAddresses = {
    usedReceiveAddresses: [],
    usedChangeAddresses: [],
    nextChangeAddress: {
      type: 0,
      index: 0,
      address: "",
      balance: INITIAL_BALANCE,
      active: false,
      timestamp: null,
    },
    nextReceiveAddress: {
      type: 0,
      index: 0,
      address: "",
      balance: INITIAL_BALANCE,
      active: false,
      timestamp: null,
    },
    totalBalance: BigNumber(0),
    spendableBalance: BigNumber(0),
  };

  // need to check UTXOs and TX history for the first account addresses

  // go through receive address and change address
  for (const type of [RECEIVE_ADDRESS_TYPE, CHANGE_ADDRESS_TYPE]) {
    let keepScanning: boolean = true;

    while (keepScanning) {
      const addresses: AccountAddress[] = [];
      for (let index = startIndex; index < startIndex + SCAN_BATCH_SIZE; index++) {
        const derivedAddress: string = kaspaBip32.getAddress(type, index);
        addresses.push({
          type: type,
          index,
          address: derivedAddress,
          balance: BigNumber(0),
          active: false,
        } as AccountAddress);
      }

      // fetch address information via API and update object
      await updateAddressesActive(addresses);

      // update balance
      for (const addr of addresses) {
        accountAddresses.totalBalance = accountAddresses.totalBalance.plus(addr.balance);
      }

      // Check the last GAP_LIMIT addresses for inactivity ( active = false )
      const lastAddressesToCheck = addresses.slice(-GAP_LIMIT);

      keepScanning = !lastAddressesToCheck.every(addr => !addr.active);
      if (keepScanning) startIndex += SCAN_BATCH_SIZE;

      updateAddressesData(addresses, accountAddresses, type, keepScanning);
    }
  }

  // Assume all the balance could be sent, there are not "locked" coins.
  accountAddresses.spendableBalance = accountAddresses.totalBalance;

  return accountAddresses;
}

/**
 * Updates the addresses data based on the type and current scanning state.
 * If the type is RECEIVE_ADDRESS_TYPE, it updates the used receive addresses and sets the next receive address.
 * If the type is CHANGE_ADDRESS_TYPE, it updates the used change addresses and sets the next change address.
 *
 * @param {AccountAddress[]} addresses - List of account addresses.
 * @param {AccountAddresses} accountAddresses - Object containing used receive and change addresses and the next addresses.
 * @param {number} type - Type of the addresses being updated. It can be either RECEIVE_ADDRESS_TYPE or CHANGE_ADDRESS_TYPE.
 * @param {boolean} keepScanning - Indicates whether to keep scanning for addresses or not.
 * @return {void}
 */
function updateAddressesData(
  addresses: AccountAddress[],
  accountAddresses: AccountAddresses,
  type: number,
  keepScanning: boolean,
): void {
  if (type === RECEIVE_ADDRESS_TYPE) {
    accountAddresses.usedReceiveAddresses.push(...addresses.filter(addr => addr.active));

    if (!keepScanning) {
      // last used address + 1
      // + 1 has to be available, as there needs to be a GAP!
      accountAddresses.nextReceiveAddress =
        addresses[
          addresses.indexOf(<AccountAddress>accountAddresses.usedReceiveAddresses.at(-1)) + 1
        ];
    }
  }
  // change address
  if (type === CHANGE_ADDRESS_TYPE) {
    accountAddresses.usedChangeAddresses.push(...addresses.filter(addr => addr.active));

    if (!keepScanning) {
      // last used address + 1
      // + 1 has to be available, as there needs to be a GAP!
      accountAddresses.nextChangeAddress =
        addresses[
          addresses.indexOf(<AccountAddress>accountAddresses.usedChangeAddresses.at(-1)) + 1
        ];
    }
  }
}

/**
 * Updates the provided array of addresses with their respective balances and active status.
 *
 * @param {AccountAddress[]} addresses - An array of account addresses to be updated.
 * @return {Promise<void>} A promise that resolves when the update operation is complete.
 */
async function updateAddressesActive(addresses: AccountAddress[]) {
  const balances = await getBalancesForAddresses(addresses.map(addr => addr.address));
  const addressesActive = await getAddressesActive(addresses.map(addr => addr.address));

  for (const addressBalance of balances) {
    const addressIndex = addresses.findIndex(addr => addr.address === addressBalance.address);
    if (addressBalance.balance > 0) {
      addresses[addressIndex].balance = BigNumber(addressBalance.balance);
      addresses[addressIndex].active = true;
    }
  }

  for (const addressActive of addressesActive) {
    const addressIndex = addresses.findIndex(addr => addr.address === addressActive.address);
    if (addressActive.active) {
      addresses[addressIndex].active = true;
      addresses[addressIndex].timestamp = addressActive.lastTxBlockTime;
    }
  }
}
