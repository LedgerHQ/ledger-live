import type { Account } from "@ledgerhq/types-live";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { fromDescriptorPath } from "@domain/entity-account-descriptor";
import type { ReceiveVerification } from "@domain/entity-account-receive";
import { loadAccountModuleForFamily } from "../coin-modules/registry";

/** The `getAddress` call showing an `address` verification on the device; none for any other type. */
export function toReceiveVerifyAddressOptions(
  account: Account,
  verification: Extract<ReceiveVerification, { type: "address" }>,
): Promise<GetAddressOptions>;
export function toReceiveVerifyAddressOptions(
  account: Account,
  verification: ReceiveVerification,
): Promise<GetAddressOptions | undefined>;
export async function toReceiveVerifyAddressOptions(
  account: Account,
  verification: ReceiveVerification,
): Promise<GetAddressOptions | undefined> {
  if (verification.type !== "address") return undefined;
  const accountModule = await loadAccountModuleForFamily(account.currency.family);
  return {
    ...accountModule?.injectGetAddressParams?.(account),
    currency: account.currency,
    derivationMode: account.derivationMode,
    path: fromDescriptorPath(verification.path),
    verify: true,
  };
}
