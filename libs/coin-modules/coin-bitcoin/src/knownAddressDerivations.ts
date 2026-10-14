import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/index";

type WalletAddress = Awaited<ReturnType<WalletAccount["xpub"]["getAccountAddresses"]>>[number];

export const FRESH_ADDRESS_WINDOW = 20;

async function nextUnusedAddresses(
  walletAccount: WalletAccount,
  chain: number,
  stored: WalletAddress[],
): Promise<WalletAddress[]> {
  const { xpub, crypto, derivationMode } = walletAccount.xpub;
  const start = stored.reduce((max, addr) => Math.max(max, addr.index), -1) + 1;
  const indexes = Array.from({ length: FRESH_ADDRESS_WINDOW }, (_, i) => start + i);
  return Promise.all(
    indexes.map(async index => ({
      address: await crypto.getAddress(derivationMode, xpub, chain, index),
      account: chain,
      index,
    })),
  );
}

export type KnownAddressDerivationsMap = Map<string, { pubkey: Buffer; path: number[] }>;

/**
 * Builds the known-address derivations map from the wallet account.
 * Used when signing a PSBT to populate missing BIP32 derivations.
 */
export async function buildKnownAddressDerivationsMap(
  walletAccount: WalletAccount,
  accountPath: string,
): Promise<KnownAddressDerivationsMap> {
  const map: KnownAddressDerivationsMap = new Map();
  const basePath = pathStringToArray(accountPath);
  const [receiveAddresses, changeAddresses] = await Promise.all([
    walletAccount.xpub.getAccountAddresses(0),
    walletAccount.xpub.getAccountAddresses(1),
  ]);
  // Also include the next unused receive/change addresses, so that a PSBT built by a live app or a
  // WalletConnect dApp that pays to a fresh address (not yet in storage) still has its BIP32
  // derivation populated. The window starts right after the highest stored index, at 0 when the
  // chain has none, and spans the usual address gap limit.
  const [nextReceiveAddresses, nextChangeAddresses] = await Promise.all([
    nextUnusedAddresses(walletAccount, 0, receiveAddresses),
    nextUnusedAddresses(walletAccount, 1, changeAddresses),
  ]);
  const addresses = [
    ...receiveAddresses,
    ...changeAddresses,
    ...nextReceiveAddresses,
    ...nextChangeAddresses,
  ];
  const { xpub, crypto } = walletAccount.xpub;

  await Promise.all(
    addresses.map(async addr => {
      const path = [...basePath, addr.account, addr.index];
      const pubkey = await crypto.getPubkeyAt(xpub, addr.account, addr.index);
      const scriptPubKey = crypto.toOutputScript(addr.address);
      const result = extractHashFromScriptPubKey(scriptPubKey);
      if (result) {
        map.set(result.hashHex, { pubkey, path });
      }
    }),
  );

  return map;
}
