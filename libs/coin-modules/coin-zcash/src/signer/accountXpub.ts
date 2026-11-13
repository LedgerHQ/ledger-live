import { pathStringToArray } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { ZCASH_XPUB_VERSION } from "../constants";
import type { BitcoinSigner } from "../types/signer";
import { composeXpub } from "./xpub";

/**
 * The xpub of the account at `accountPath` (e.g. `44'/133'/0'`), composed from the keys of the
 * account and of its parent: the DMK Zcash signer kit has no xpub command.
 */
export async function deriveAccountXpub(
  signer: BitcoinSigner,
  accountPath: string,
): Promise<string> {
  const accountPathElements = pathStringToArray(accountPath);
  if (accountPathElements.length === 0) {
    throw new Error(`Cannot derive xpub from empty path "${accountPath}"`);
  }
  const parentPath = accountPath.split("/").slice(0, -1).join("/");
  const parent = await signer.getAddress(parentPath, false);
  const account = await signer.getAddress(accountPath, false);
  return composeXpub({
    xpubVersion: ZCASH_XPUB_VERSION,
    depth: accountPathElements.length,
    childNumber: accountPathElements[accountPathElements.length - 1],
    parentPublicKeyHex: parent.publicKey,
    accountPublicKeyHex: account.publicKey,
    accountChainCodeHex: account.chainCode,
  });
}
