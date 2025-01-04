import KaspaBIP32 from "../lib/bip32";
import { getBalancesForAddresses } from "./indexer-api/getBalancesForAddresses";
import { BigNumber } from "bignumber.js";
import { getAddressesActive } from "./indexer-api/getAddressesActive";
import { getUtxosForAddresses } from "./indexer-api/getUtxosForAddresses";
import getTransactions from "./indexer-api/getTransactions";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { KaspaUtxo } from "../types/kaspaNetwork";

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

const MAX_TX_INPUTS = 88; // floor (( 100_000 - 918 (def_size with 2 outputs) ) / 1_118 (per_input))

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
    .reduce((acc, v) => acc.plus(v), BigNumber(0));

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

export async function scanOperations(addresses: string[], accountId: string): Promise<Operation[]> {
  const operations: Operation[] = [];

  // console.log(`Timestamp with ms: ${new Date().toISOString()}`);
  const fetchedTxs = await Promise.all(addresses.map(addr => getTransactions(addr))).then(results =>
    results.flat(),
  );
  // console.log(`Timestamp with ms: ${new Date().toISOString()}`);

  for (const tx of fetchedTxs) {
    const myInputAmount: BigNumber = tx.inputs.reduce((acc: BigNumber, v): BigNumber => {
      if (addresses.includes(v.previous_outpoint_address)) {
        return acc.plus(BigNumber(v.previous_outpoint_amount));
      }
      return acc;
    }, BigNumber(0));

    const myOutputAmount: BigNumber = tx.outputs.reduce((acc: BigNumber, v) => {
      if (addresses.includes(v.script_public_key_address)) {
        return acc.plus(BigNumber(v.amount));
      }
      return acc;
    }, BigNumber(0));

    const totalOutputAmount: BigNumber = tx.outputs.reduce(
      (acc: BigNumber, v) => acc.plus(BigNumber(v.amount)),
      BigNumber(0),
    );
    const totalInputAmount: BigNumber = tx.inputs.reduce(
      (acc: BigNumber, v) => acc.plus(BigNumber(v.previous_outpoint_amount)),
      BigNumber(0),
    );

    // console.log(`In ${myInputAmount.toString()}`);
    // console.log(`Out ${myOutputAmount.toString()}`);

    const operationType: OperationType = myOutputAmount.gt(myInputAmount) ? "IN" : "OUT";

    operations.push({
      id: tx.transaction_id,
      hash: tx.transaction_id,
      type: operationType,
      value: myOutputAmount.minus(myInputAmount).absoluteValue(),
      fee: totalInputAmount.minus(totalOutputAmount),
      senders: tx.inputs.map(inp => inp.previous_outpoint_address),
      recipients: tx.outputs.map(output => output.script_public_key_address),
      blockHeight: tx.accepting_block_blue_score,
      blockHash: tx.block_hash[0],
      accountId: accountId,
      date: new Date(tx.block_time),
      extra: {},
    } as Operation);
  }

  return operations;
}

export async function scanUtxos(
  compressedPublicKey: Buffer,
  chainCode: Buffer,
): Promise<{ utxos: KaspaUtxo[]; accountAddresses: AccountAddresses }> {
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

  // Convert utxoEntry.amount to BigNumber
  kaspaUtxos.forEach(utxo => {
    utxo.utxoEntry.amount = BigNumber(utxo.utxoEntry.amount);
  });

  return {
    utxos: kaspaUtxos as KaspaUtxo[],
    accountAddresses: accountAddresses,
  };
}
