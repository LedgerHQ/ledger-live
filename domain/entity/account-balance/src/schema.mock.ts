import { AccountIdSchema, BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import type { AccountBalance } from "./schema";

const DEFAULT_ACCOUNT_ID = "js:2:ethereum:0xabc:";
const DEFAULT_AT = "2026-01-31T12:00:00.000Z";

/** A main-account balance row. Every field is overridable; the defaults are a plain ETH account. */
export const mockAccountBalance = (overrides: Partial<AccountBalance> = {}): AccountBalance => ({
  accountId: AccountIdSchema.parse(DEFAULT_ACCOUNT_ID),
  assetId: CryptoCurrencyIdSchema.parse("ethereum"),
  balance: BigNumberStrSchema.parse("1000000000000000000"),
  spendableBalance: BigNumberStrSchema.parse("1000000000000000000"),
  at: DateTimeIsoSchema.parse(DEFAULT_AT),
  ...overrides,
});

/** A token-account balance row, parented to {@link mockAccountBalance}'s account by default. */
export const mockTokenAccountBalance = (
  overrides: Partial<AccountBalance> = {},
): AccountBalance => ({
  accountId: AccountIdSchema.parse(`${DEFAULT_ACCOUNT_ID}+ethereum%2Ferc20%2Fusd__coin`),
  assetId: TokenCurrencyIdSchema.parse("ethereum/erc20/usd__coin"),
  balance: BigNumberStrSchema.parse("2500000"),
  spendableBalance: BigNumberStrSchema.parse("2500000"),
  parentId: AccountIdSchema.parse(DEFAULT_ACCOUNT_ID),
  at: DateTimeIsoSchema.parse(DEFAULT_AT),
  ...overrides,
});
