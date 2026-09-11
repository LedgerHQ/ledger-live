import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { AmountStrSchema, type AccountBalance } from "@domain/entity-account-balance";
import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { AccountIdSchema, TokenAccountIdSchema } from "@domain/entity-account";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

const toTokenBalance = (account: TokenAccount, at: string): AccountBalance => ({
  accountId: TokenAccountIdSchema.parse(account.id),
  assetId: TokenCurrencyIdSchema.parse(account.token.id),
  balance: AmountStrSchema.parse(account.balance.toFixed()),
  spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
  parentId: AccountIdSchema.parse(account.parentId),
  at: DateTimeIsoSchema.parse(at),
});

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
