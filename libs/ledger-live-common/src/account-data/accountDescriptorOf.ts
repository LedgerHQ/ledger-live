import type { Account } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromLegacyAccount } from "./legacyAccount";

/**
 * The descriptor of a legacy account: what identifies it, without the account itself. The key is the
 * xpub or address encoded in the account id, which never changes: `seedIdentifier` is the device
 * public key on some families, and `freshAddress` moves.
 */
export function accountDescriptorOf(
  account: Pick<Account, "id" | "derivationMode" | "index"> & {
    currency: Pick<Account["currency"], "id">;
  },
): AccountDescriptor {
  return fromLegacyAccount({
    currencyId: account.currency.id,
    seedIdentifier: decodeAccountId(account.id).xpubOrAddress,
    derivationMode: account.derivationMode,
    index: account.index,
  });
}
