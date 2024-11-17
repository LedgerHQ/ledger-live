import KaspaBIP32 from "../lib/bip32";
import { getBalancesForAddresses } from "./indexer-api/getBalancesForAddresses";
import { BigNumber } from "bignumber.js";
import { getAddressesActive } from "./indexer-api/getAddressesActive";
import { KaspaUtxo } from "../types/bridge";
import { getUtxosForAddresses } from "./indexer-api/getUtxosForAddresses";

export { getFeeEstimate } from "./indexer-api/getFeeEstimate";
export { getBalancesForAddresses } from "./indexer-api/getBalancesForAddresses";
export { getUtxosForAddresses } from "./indexer-api/getUtxosForAddresses";
export { submitTransaction } from "./indexer-api/submitTransaction";

// Constants to improve clarity
const RECEIVE_ADDRESS_TYPE = 0;
const CHANGE_ADDRESS_TYPE = 1;
const INITIAL_BALANCE = BigNumber(0);
const GAP_LIMIT = 20;
const SCAN_BATCH_SIZE = 200;

const MAX_TX_INPUTS = 88; // floor (( 100_000 - 918 (def_size) ) / 1_118 (per_input))
const MASS_PER_UTXO_INPUT = 1_118;
const DEFAULT_MASS_WITHOUT_INPUT = 918;

type AccountAddress = {
  type: number;
  index: number;
  address: string;
  balance: BigNumber;
  active: boolean;
};

/**
 * Interface representing account addresses and related balance information.
 */
export interface AccountAddresses {
  usedReceiveAddresses: AccountAddress[];
  usedChangeAddresses: AccountAddress[];
  nextChangeAddress: AccountAddress;
  nextReceiveAddress: AccountAddress;
  totalBalance: BigNumber;
  spendableBalance: BigNumber;
}

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
  startIndex: number = 0,
): Promise<AccountAddresses> {
  const kaspaBip32: KaspaBIP32 = new KaspaBIP32(compressedPublicKey, chainCode);

  const accountAddresses: AccountAddresses = {
    usedReceiveAddresses: [],
    usedChangeAddresses: [],
    nextChangeAddress: { type: 0, index: 0, address: "", balance: INITIAL_BALANCE, active: false },
    nextReceiveAddress: { type: 0, index: 0, address: "", balance: INITIAL_BALANCE, active: false },
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

  const countUsedAddresses =
    accountAddresses.usedChangeAddresses.length + accountAddresses.usedReceiveAddresses.length;
  const spendableBalance = [
    ...accountAddresses.usedChangeAddresses,
    ...accountAddresses.usedReceiveAddresses,
  ]
    .sort((a, b) => b.balance.minus(a.balance).toNumber())
    .slice(0, MAX_TX_INPUTS)
    .map(utxo => utxo.balance)
    .reduce((acc, v) => acc.plus(v), BigNumber(0))
    .minus(
      BigNumber(
        DEFAULT_MASS_WITHOUT_INPUT +
          MASS_PER_UTXO_INPUT * Math.min(MAX_TX_INPUTS, countUsedAddresses),
      ),
    );

  accountAddresses.spendableBalance = spendableBalance;

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
    }
  }
}

function getTypeAndIndexFromAccountAddresses(accountAddreses: AccountAddress[], address: string) {
  const foundAddress = accountAddreses.find(addr => addr.address === address);
  if (foundAddress) {
    return { accountType: foundAddress.type, accountIndex: foundAddress.index };
  } else {
    throw new Error(`Address ${address} not found in addresses set.`);
  }
}

export async function scanUtxos(
  compressedPublicKey: Buffer,
  chainCode: Buffer,
): Promise<KaspaUtxo[]> {
  const accountAddresses: AccountAddresses = await scanAddresses(compressedPublicKey, chainCode, 0);

  const allUsedAddresses = [
    ...accountAddresses.usedReceiveAddresses,
    ...accountAddresses.usedChangeAddresses,
  ];

  const utxoResponse = await getUtxosForAddresses(allUsedAddresses.map(addrObj => addrObj.address));

  const kaspaUtxos = utxoResponse.map(utxo => {
    return {
      ...utxo,
      ...getTypeAndIndexFromAccountAddresses(allUsedAddresses, utxo.address),
    };
  });

  return kaspaUtxos as KaspaUtxo[];
}
