import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { cryptoFor } from "./currency";

export { parsePsbt } from "@ledgerhq/psbtv2";
export { feeFromPsbt } from "./psbtFees";

export type KnownAddressDerivations = Map<string, { pubkey: Buffer; path: number[] }>;

/**
 * BIP32 derivations of the given addresses of an account, keyed by script hash — what the device
 * needs to recognize the account's own inputs and outputs in a PSBT built by someone else.
 */
export async function buildKnownAddressDerivations(
  currencyId: string,
  xpub: string,
  accountPath: string,
  addresses: Array<{ address: string; chain: number; index: number }>,
): Promise<KnownAddressDerivations> {
  const crypto = cryptoFor(currencyId);
  const basePath = pathStringToArray(accountPath);
  const map: KnownAddressDerivations = new Map();
  await Promise.all(
    addresses.map(async ({ address, chain, index }) => {
      const pubkey = await crypto.getPubkeyAt(xpub, chain, index);
      const hash = extractHashFromScriptPubKey(crypto.toOutputScript(address));
      if (hash) map.set(hash.hashHex, { pubkey, path: [...basePath, chain, index] });
    }),
  );
  return map;
}
