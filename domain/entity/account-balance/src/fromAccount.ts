import { AccountIdSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { AmountStrSchema, type AccountBalance } from "./schema";

/** Anything that prints itself as a decimal string — `BigNumber` and `Decimal` both qualify. */
export type AmountLike = { toFixed(): string };

type AccountForBalanceBase = {
  id: string;
  balance: AmountLike;
  spendableBalance: AmountLike;
};

export type MainAccountForBalance = AccountForBalanceBase & {
  currency: { id: string };
  subAccounts?: TokenAccountForBalance[] | null;
};

export type TokenAccountForBalance = AccountForBalanceBase & {
  token: { id: string };
  parentId: string;
};

/**
 * Structural view of a legacy account, narrow enough that `Account` and `TokenAccount` from
 * `@ledgerhq/types-live` satisfy it as-is. Declared here rather than imported so this package never
 * depends on the account god object it is carving up.
 */
export type AccountForBalance = MainAccountForBalance | TokenAccountForBalance;

const toTokenBalance = (account: TokenAccountForBalance, at: string): AccountBalance => ({
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
 * This is the read half of the compatibility seam — the thing that lets the balance table be filled
 * by today's full account sync while nothing downstream has migrated yet. Its output is exactly what
 * `replaceAccountBalances` expects, so a token account that vanished from a sync also vanishes from
 * the table.
 */
export function toAccountBalances(
  account: AccountForBalance,
  at: Date = new Date(),
): AccountBalance[] {
  const isoDate = at.toISOString();
  if ("token" in account) return [toTokenBalance(account, isoDate)];
  return [
    {
      accountId: AccountIdSchema.parse(account.id),
      assetId: CryptoCurrencyIdSchema.parse(account.currency.id),
      balance: AmountStrSchema.parse(account.balance.toFixed()),
      spendableBalance: AmountStrSchema.parse(account.spendableBalance.toFixed()),
      at: DateTimeIsoSchema.parse(isoDate),
    },
    ...(account.subAccounts ?? []).map(subAccount => toTokenBalance(subAccount, isoDate)),
  ];
}
