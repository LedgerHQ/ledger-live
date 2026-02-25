import { pathStringToArray } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import type { Account as WalletAccount } from "./wallet-btc";

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
  const [
    receiveAddresses,
    changeAddresses,
    nextReceiveAddress1,
    nextChangeAddress1,
    nextReceiveAddress2,
    nextChangeAddress2,
  ] = await Promise.all([
    walletAccount.xpub.getAccountAddresses(0),
    walletAccount.xpub.getAccountAddresses(1),
    // Include the next 2 unused receive/change addresses so PSBTs that send to a
    // fresh address (not yet in storage) can still be recognized and have their
    // BIP32 derivation populated correctly. 2 addresses ahead covers WalletConnect
    // and similar live-app flows that may use consecutive fresh addresses.
    walletAccount.xpub.getNewAddress(0, 1),
    walletAccount.xpub.getNewAddress(1, 1),
    walletAccount.xpub.getNewAddress(0, 2),
    walletAccount.xpub.getNewAddress(1, 2),
  ]);
  const addresses = [
    ...receiveAddresses,
    ...changeAddresses,
    nextReceiveAddress1,
    nextChangeAddress1,
    nextReceiveAddress2,
    nextChangeAddress2,
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
