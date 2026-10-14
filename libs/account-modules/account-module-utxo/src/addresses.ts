import type { AccountDescriptor } from "@ledgerhq/account-module-framework";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { UtxoAddressState, UtxoPrimitives } from "./types";

export const addressPath = (accountPath: string, chain: number, index: number): string =>
  `${accountPath}/${chain}/${index}`;

/** The first index of `chain` above the highest one holding history. */
export const nextIndex = (addresses: UtxoAddressState[], chain: number): number =>
  addresses.filter(a => a.chain === chain).reduce((next, a) => Math.max(next, a.index + 1), 0);

export type AddressDeriver = (chain: number, index: number) => Promise<string>;

export const deriverOf =
  (
    api: Pick<UtxoPrimitives, "deriveAddress">,
    context: Context<any>,
    { key, derivationMode }: Pick<AccountDescriptor, "key" | "derivationMode">,
  ): AddressDeriver =>
  (chain, index) =>
    api.deriveAddress(context, { key, derivationMode, chain, index });

export const displayOf =
  (api: Pick<UtxoPrimitives, "displayAddress">) =>
  (address: string): string =>
    api.displayAddress?.(address) ?? address;

/** The next unused address of a chain, as derived, and its path. */
export async function nextAddress(
  derive: AddressDeriver,
  descriptor: Pick<AccountDescriptor, "derivationPath">,
  addresses: UtxoAddressState[],
  chain: number,
): Promise<{ address: string; derivationPath: string }> {
  const index = nextIndex(addresses, chain);
  return {
    address: await derive(chain, index),
    derivationPath: addressPath(descriptor.derivationPath, chain, index),
  };
}
