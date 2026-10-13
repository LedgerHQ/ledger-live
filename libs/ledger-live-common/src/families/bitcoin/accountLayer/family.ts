import { BigNumber } from "bignumber.js";
import type { MultiAddressAccountFamily } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { deduplicateOperations } from "@ledgerhq/wallet-btc/operations";
import {
  getNetworkParameters,
  type BitcoinOperationDetails,
  type BitcoinTxDetails,
} from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinAccount, BitcoinAccountState, BtcOperation } from "../types";
import type { BitcoinDeviceSigner } from "../signer";
import { CHANGE_CHAIN, RECEIVE_CHAIN, bitcoinAddressDeriver } from "./derivation";
import { getSerializedAddressParameters } from "./exchange";
import { displayAddress, txToOperations } from "./interpret";
import { decorateOptimisticOperation, isPendingSettled, mergeSentOperation } from "./pending";
import { completeIntent } from "./selection";
import { bitcoinResyncError, emptyAccountState, readBitcoinState } from "./state";
import { applyConfirmedTxs, reconcile, withMempool } from "./utxos";

/** Unused addresses walked past the last used one, per chain (BIP44). */
export const GAP = 20;

/**
 * Blocks re-read below the last synced tip: a transaction of a block replaced since must not be
 * missed, and the overlap is harmless (operations and UTXOs are keyed).
 */
export const REWIND_BLOCKS = 6;

async function getAccountKey(
  {
    currencyId,
    accountPath,
    deviceId,
  }: { currencyId: string; accountPath: string; deviceId: string | undefined },
  signerContext: SignerContext<BitcoinDeviceSigner>,
): Promise<string> {
  if (deviceId === undefined || deviceId === null) {
    throw new Error("deviceId required to generate the xpub");
  }
  const xpubVersion = getNetworkParameters(currencyId).xpubVersion.readUInt32BE(0);
  return signerContext(deviceId, signer =>
    signer.getWalletXpub({ currencyId, path: accountPath, xpubVersion }),
  );
}

const ownAddresses = (state: Pick<BitcoinAccountState, "addresses">, chain?: number) =>
  new Set(
    state.addresses.filter(a => chain === undefined || a.chain === chain).map(a => a.address),
  );

/**
 * The bitcoin family on the multi-address engine (ADR-065): an xpub account on a receive and a
 * change chain, whose accounting is its UTXO set.
 */
export const bitcoinFamily: MultiAddressAccountFamily<BitcoinTxDetails, BitcoinAccountState> = {
  chains: [RECEIVE_CHAIN, CHANGE_CHAIN],
  receiveChain: RECEIVE_CHAIN,
  gapLimit: GAP,
  rewindBlocks: REWIND_BLOCKS,

  getAccountKey,
  addressDeriver: bitcoinAddressDeriver,
  displayAddress,
  transactionOf: operation => (operation.details as BitcoinOperationDetails).tx,

  readState: readBitcoinState,
  emptyState: emptyAccountState,
  resyncError: bitcoinResyncError,

  interpret: (transactions, { currencyId, accountId, addresses }) => {
    const own = ownAddresses({ addresses });
    const change = ownAddresses({ addresses }, CHANGE_CHAIN);
    return deduplicateOperations(
      transactions.flatMap(tx => txToOperations(tx, currencyId, accountId, own, change)),
    );
  },

  settle: ({ currencyId, state, confirmed, pending, operations }) => {
    const own = ownAddresses(state);
    const confirmedUtxos = applyConfirmedTxs(state.confirmedUtxos, confirmed, own);
    const reconciled = reconcile(
      operations as BtcOperation[],
      withMempool(confirmedUtxos, pending, own),
      currencyId,
      ownAddresses(state, CHANGE_CHAIN),
    );
    const balance = reconciled.utxos.reduce(
      (total, utxo) => total.plus(utxo.value),
      new BigNumber(0),
    );
    const accountState: BitcoinAccountState = { ...state, confirmedUtxos };
    return {
      state: accountState,
      operations: reconciled.operations,
      balance,
      spendableBalance: balance,
      accountFields: {
        bitcoinResources: { utxos: reconciled.utxos, accountState },
      } as Partial<BitcoinAccount>,
    };
  },

  completeIntent,
  isPendingSettled,
  mergeSentOperation,
  decorateOptimisticOperation,
  getSerializedAddressParameters,
};
