import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account, AccountIdParams } from "@ledgerhq/types-live";

/**
 * The `xpubOrAddress` (and any `customData`) of a family keyed on the public key
 * (`BridgeApi.accountIdFromPublicKey`). The stored id wins over the live public key, so a sync never
 * re-keys an account, including one a legacy bridge once keyed on its address. Only a scan, which
 * has no stored id, uses the key.
 */
export function publicKeyAccountIdBasis(
  initialAccount: Account | undefined,
  publicKey: string | undefined,
  address: string,
): Pick<AccountIdParams, "xpubOrAddress" | "customData"> {
  if (initialAccount) {
    try {
      const { xpubOrAddress, customData } = decodeAccountId(initialAccount.id);
      return { xpubOrAddress, ...(customData && { customData }) };
    } catch {
      // A malformed stored id falls through to the scan rule.
    }
  }
  return { xpubOrAddress: publicKey || address };
}
