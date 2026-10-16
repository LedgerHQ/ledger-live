import cashaddr from "cashaddrjs";
import type { BitcoinCoinConfig } from "../config";

/**
 * Bitcoin Cash's cashaddr format, for currencies whose config says `addressFormat: "cashaddr"`.
 *
 * Ledger Wallet stores Bitcoin Cash addresses as cashaddr without the `bitcoincash:` prefix, which
 * the explorer does not answer for (`balance`, `utxos`: 500; `txs`: empty), and the Ledger app shows a
 * recipient as cashaddr only when told so (hw-app-btc `additionals: ["cashaddr"]`).
 */

const PREFIX = "bitcoincash:";

/** The address in the form the explorer answers for: prefixed when the currency uses cashaddr. */
export function explorerAddress(config: BitcoinCoinConfig, address: string): string {
  if (config.addressFormat !== "cashaddr" || address.includes(":")) return address;
  try {
    cashaddr.decode(PREFIX + address);
    return PREFIX + address;
  } catch {
    return address;
  }
}

/** Whether a recipient is a cashaddr P2PKH address, prefixed or not: the Ledger app shows it as cashaddr. */
export function isCashaddrRecipient(recipient: string): boolean {
  try {
    const { type } = cashaddr.decode(recipient.includes(":") ? recipient : PREFIX + recipient);
    return type === "P2PKH";
  } catch {
    return false;
  }
}

/**
 * The recipient as Ledger Wallet shows it, from its output script: a P2PKH script in cashaddr, any
 * other script as none.
 */
export function shownRecipient(script: Buffer): string {
  const p2pkh = script.length === 25 && script[0] === 0x76 && script[1] === 0xa9;
  return p2pkh
    ? cashaddr.encode("bitcoincash", "P2PKH", new Uint8Array(script.subarray(3, 23)))
    : "";
}
