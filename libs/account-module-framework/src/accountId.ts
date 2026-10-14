import type { AccountDescriptor } from "./types";

/**
 * The id of an account, as Ledger Wallet keys it (`js:2:<currency>:<key>:<derivation mode>`).
 * Shared so that an account moved from one client, or one implementation, to another is not
 * re-keyed.
 */
export const accountIdOf = ({
  currencyId,
  key,
  derivationMode,
}: Pick<AccountDescriptor, "currencyId" | "key" | "derivationMode">): string =>
  `js:2:${currencyId}:${key}:${derivationMode}`;

/** "84'/0'" (or any deeper path) and an account index → "84'/0'/3'". */
export function accountDerivationPath(derivationScheme: string, index: number): string {
  const [purpose, coinType] = derivationScheme.split("/");
  if (!purpose || !coinType) throw new Error(`Invalid derivation scheme ${derivationScheme}`);
  return `${purpose}/${coinType}/${index}'`;
}
