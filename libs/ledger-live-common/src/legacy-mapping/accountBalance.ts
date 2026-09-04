import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { AmountStrSchema, type AccountBalance } from "@domain/entity-account-balance";
import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

const toTokenBalance = (account: TokenAccount, at: string): AccountBalance => ({
  accountId: AccountIdSchema.parse(account.id),
  assetId: TokenCurrencyIdSchema.parse(account.token.id),
  balance: AmountStrSchema.parse(account.balance.toFixed()),
  spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
  parentId: AccountIdSchema.parse(account.parentId),
  at: DateTimeIsoSchema.parse(at),
});

/**
 * Project a legacy account onto balance rows: one for the account itself, then one per token
 * account it holds.
 *
 * The read half of the compatibility seam, and the reason it lives here rather than in
 * `@domain/entity-account-balance`: the entity must not know what an `Account` is. A DDD entity that
 * imports `@ledgerhq/types-live` inherits the god object it was created to carve up, so the
 * projection is the *legacy* side's job and belongs on the legacy side of the boundary.
 *
 * Its output is exactly what `accountBalanceReceived` expects, so a token account that vanished from
 * a sync also vanishes from the table.
 */
export function toAccountBalances(account: AccountLike, at: Date = new Date()): AccountBalance[] {
  const isoDate = at.toISOString();
  if (account.type === "TokenAccount") return [toTokenBalance(account, isoDate)];
  const main = account as Account;
  return [
    {
      accountId: AccountIdSchema.parse(main.id),
      assetId: CryptoCurrencyIdSchema.parse(main.currency.id),
      balance: AmountStrSchema.parse(main.balance.toFixed()),
      spendableBalance: AmountStrSchema.parse(main.spendableBalance.toFixed()),
      at: DateTimeIsoSchema.parse(isoDate),
    },
    ...(main.subAccounts ?? []).map(subAccount => toTokenBalance(subAccount, isoDate)),
  ];
}
