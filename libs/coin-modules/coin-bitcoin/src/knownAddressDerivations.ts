import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import type { Account as WalletAccount } from "@ledgerhq/wallet-btc/index";

export type KnownAddressDerivationsMap = Map<string, { pubkey: Buffer; path: number[] }>;

type Derivation = { account: number; index: number; address?: string };

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
  const { xpub, crypto, derivationMode, GAP } = walletAccount.xpub;

  // Every address of each chain up to GAP past the highest stored index (the first GAP when none
  // is stored), reusing the stored ones. Unused addresses below the highest used one are covered
  // too, so a PSBT that pays any of them, e.g. a change address picked by a live app, still gets
  // its BIP32 derivation.
  const derivationsPerChain = await Promise.all(
    [0, 1].map(async (account): Promise<Derivation[]> => {
      const stored = await walletAccount.xpub.getAccountAddresses(account);
      const storedByIndex = new Map(stored.map(addr => [addr.index, addr]));
      const end = stored.reduce((max, addr) => Math.max(max, addr.index), -1) + 1 + GAP;
      return Array.from(
        { length: end },
        (_, index): Derivation => storedByIndex.get(index) ?? { account, index },
      );
    }),
  );

  await Promise.all(
    derivationsPerChain.flat().map(async ({ account, index, address }) => {
      const path = [...basePath, account, index];
      const [pubkey, resolvedAddress] = await Promise.all([
        crypto.getPubkeyAt(xpub, account, index),
        address ?? crypto.getAddress(derivationMode, xpub, account, index),
      ]);
      const scriptPubKey = crypto.toOutputScript(resolvedAddress);
      const result = extractHashFromScriptPubKey(scriptPubKey);
      if (result) {
        map.set(result.hashHex, { pubkey, path });
      }
    }),
  );

  return map;
}
