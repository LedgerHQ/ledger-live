import type { Account } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountNeedResync } from "@ledgerhq/wallet-btc/errors";
import type { BitcoinAccount } from "./types";
import { accountPathOf } from "../../bridge/generic-coin-framework/multiAddressAccountLayer";
import { cryptoFor, toWalletDerivationMode } from "./accountLayer/derivation";
import { displayAddress } from "./accountLayer/interpret";
import { readAccountState } from "./accountLayer/state";

export type BitcoinAccountKeys = {
  /** "84'/0'" */
  rootPath: string;
  accountIndex: number;
  addressAt: (chain: number, index: number) => Promise<string>;
  pubkeyAt: (chain: number, index: number) => Promise<Buffer>;
  /** The addresses holding history, and whether they hold unspent outputs. */
  addresses: () => Array<{ address: string; chain: number; index: number; hasUtxo: boolean }>;
};

/**
 * Keys and addresses of a bitcoin-family account, for the live apps that ask for them (wallet API).
 * Zcash accounts still carry the legacy bridge's store; the others the account layer's state.
 */
export function getBitcoinAccountKeys(account: Account): BitcoinAccountKeys {
  const bitcoinAccount = account as BitcoinAccount;
  const walletAccount = bitcoinAccount.bitcoinResources?.walletAccount;
  if (walletAccount) {
    const { xpub } = walletAccount;
    return {
      rootPath: walletAccount.params.path,
      accountIndex: walletAccount.params.index,
      addressAt: (chain, index) =>
        xpub.crypto.getAddress(xpub.derivationMode, xpub.xpub, chain, index),
      pubkeyAt: (chain, index) => xpub.crypto.getPubkeyAt(xpub.xpub, chain, index),
      addresses: () =>
        xpub.storage.getUniquesAddresses({}).map(a => ({
          address: a.address,
          chain: a.account,
          index: a.index,
          hasUtxo: (xpub.storage.getAddressUnspentUtxos(a) ?? []).length > 0,
        })),
    };
  }

  const state = readAccountState(bitcoinAccount.bitcoinResources?.accountState);
  if (account.id.startsWith("libcore") || !state) throw new AccountNeedResync();
  const currencyId = account.currency.id;
  const crypto = cryptoFor(currencyId);
  const derivationMode = toWalletDerivationMode(account.derivationMode);
  const xpub = decodeAccountId(account.id).xpubOrAddress;
  const withUtxo = new Set((bitcoinAccount.bitcoinResources?.utxos ?? []).map(u => u.address));
  return {
    rootPath: accountPathOf(account.freshAddressPath).split("/").slice(0, 2).join("/"),
    accountIndex: account.index,
    addressAt: (chain, index) => crypto.getAddress(derivationMode, xpub, chain, index),
    pubkeyAt: (chain, index) => crypto.getPubkeyAt(xpub, chain, index),
    addresses: () =>
      state.addresses.map(a => ({
        address: a.address,
        chain: a.chain,
        index: a.index,
        hasUtxo: withUtxo.has(displayAddress(currencyId, a.address)),
      })),
  };
}
