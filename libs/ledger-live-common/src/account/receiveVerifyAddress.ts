import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { ReceiveVerification } from "@domain/entity-account-receive";
import { resolveFamily } from "../bridge/zcashRouting";
import { loadReceiveGetAddressParamsForFamily } from "../coin-modules/registry";
import { toLegacyAccount } from "./accountDescriptor";

/** The `getAddress` path of a verification: no `m/` prefix, `'` hardened markers. */
const toGetAddressPath = (path: string) => path.slice(2).replaceAll("h", "'");

/**
 * The `getAddress` call that makes the device show the receive address of a verification, compared
 * to `verification.address`. None for a key, a given address or the shielded address: `getAddress`
 * checks neither, and the shielded one goes through `getShieldedAddress`.
 */
export async function toReceiveVerifyAddressOptions(
  descriptor: AccountDescriptor,
  verification: ReceiveVerification,
  target: "receive" | "shielded",
): Promise<GetAddressOptions | undefined> {
  if (target === "shielded" || verification.type !== "address") return undefined;
  const { currencyId, derivationMode } = toLegacyAccount(descriptor);
  const currency = getCryptoCurrencyById(currencyId);
  const familyParams = await loadReceiveGetAddressParamsForFamily(resolveFamily(currency));
  return {
    ...familyParams?.(currency),
    currency,
    derivationMode,
    path: toGetAddressPath(verification.path),
    verify: true,
  };
}
