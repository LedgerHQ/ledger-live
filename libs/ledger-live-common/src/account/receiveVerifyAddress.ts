import type { Account } from "@ledgerhq/types-live";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import type { ReceiveVerification } from "@domain/entity-account-receive";
import { resolveFamily } from "../bridge/zcashRouting";
import { loadAccountModuleForFamily } from "../coin-modules/registry";

/** The `getAddress` path of a verification: no `m/` prefix, `'` hardened markers. */
const toGetAddressPath = (path: string) => path.slice(2).replaceAll("h", "'");

/** The `getAddress` call showing an `address` verification on the device; none for any other type. */
export async function toReceiveVerifyAddressOptions(
  account: Account,
  verification: ReceiveVerification,
): Promise<GetAddressOptions | undefined> {
  if (verification.type !== "address") return undefined;
  const accountModule = await loadAccountModuleForFamily(resolveFamily(account.currency));
  return {
    ...accountModule?.injectGetAddressParams?.(account),
    currency: account.currency,
    derivationMode: account.derivationMode,
    path: toGetAddressPath(verification.path),
    verify: true,
  };
}
