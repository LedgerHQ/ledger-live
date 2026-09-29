import type { Account } from "@ledgerhq/types-live";
import { AccountRefSchema, type AccountRef } from "@domain/entity-account";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";

export function accountRefOf(
  account: Pick<Account, "id" | "freshAddress" | "derivationMode"> & {
    currency: Pick<Account["currency"], "id">;
  },
): AccountRef {
  const { xpubOrAddress } = decodeAccountId(account.id);
  return AccountRefSchema.parse({
    accountId: account.id,
    currencyId: account.currency.id,
    address: account.freshAddress || xpubOrAddress,
    derivationMode: account.derivationMode ?? "",
  });
}
