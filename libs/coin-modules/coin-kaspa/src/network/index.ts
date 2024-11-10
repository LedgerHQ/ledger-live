import KaspaBIP32 from "../lib/bip32";
import { getBalancesForAddresses } from "./indexer-api/getBalancesForAddresses";
import { BigNumber } from "bignumber.js";
import { getAddressesActive } from "./indexer-api/getAddressesActive";

export { getFeeEstimate } from "./indexer-api/getFeeEstimate";
export { getBalancesForAddresses } from "./indexer-api/getBalancesForAddresses";
export { getUtxosForAddresses } from "./indexer-api/getUtxosForAddresses";

// Constants to improve clarity
const RECEIVE_ADDRESS_TYPE = 0;
const CHANGE_ADDRESS_TYPE = 1;
const INITIAL_BALANCE = BigNumber(0);
const GAP_LIMIT = 50;
const SCAN_BATCH_SIZE = 100;

type AccountAddress = {
  type: number;
  index: number;
  address: string;
  balance: BigNumber;
  active: boolean;
};

export interface AccountAddresses {
  usedReceiveAddresses: AccountAddress[];
  usedChangeAddresses: AccountAddress[];
  nextChangeAddress: AccountAddress;
  nextReceiveAddress: AccountAddress;
  totalBalance: BigNumber;
}

export async function scanAddresses(
  compressedPublicKey: Buffer,
  chainCode: Buffer,
  startIndex: number = 0,
): Promise<AccountAddresses> {
  const kaspaBip32: KaspaBIP32 = new KaspaBIP32(compressedPublicKey, chainCode);

  const accountAddresses: AccountAddresses = {
    usedReceiveAddresses: [],
    usedChangeAddresses: [],
    nextChangeAddress: { type: 0, index: 0, address: "", balance: INITIAL_BALANCE, active: false },
    nextReceiveAddress: { type: 0, index: 0, address: "", balance: INITIAL_BALANCE, active: false },
    totalBalance: BigNumber(0),
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

      // update balance and utxo count
      for (const addr of addresses) {
        accountAddresses.totalBalance = accountAddresses.totalBalance.plus(addr.balance);
      }

      // Check the last GAP_LIMIT addresses for activity
      const lastAddressesToCheck = addresses.slice(-GAP_LIMIT);

      keepScanning = !lastAddressesToCheck.every(addr => !addr.active);
      if (keepScanning) startIndex += SCAN_BATCH_SIZE;

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
  }

  return accountAddresses;
}

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
    }
  }
}
