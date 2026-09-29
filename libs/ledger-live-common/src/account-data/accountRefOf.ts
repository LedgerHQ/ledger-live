import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { AccountIdSchema } from "@domain/entity-account";
import type { AccountRef } from "@features/platform-account-data";

export function accountRefOf(account: {
  id: string;
  freshAddress?: string;
  derivationMode?: string;
  currency: { id: string };
}): AccountRef {
  const { xpubOrAddress } = decodeAccountId(account.id);
  return {
    accountId: AccountIdSchema.parse(account.id),
    currencyId: account.currency.id,
    address: account.freshAddress || xpubOrAddress,
    derivationMode: account.derivationMode ?? "",
  };
}
