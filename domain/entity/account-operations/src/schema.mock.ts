import { AccountIdSchema, BigNumberStrSchema, DateTimeIsoSchema } from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import type { AccountOperation } from "./schema";

const DEFAULT_ACCOUNT_ID = "js:2:ethereum:0xabc:";

/** One operation. Every field is overridable; the defaults are a plain incoming ETH transfer. */
export const mockAccountOperation = (
  overrides: Partial<AccountOperation> = {},
): AccountOperation => ({
  id: "js:2:ethereum:0xabc:-0xdeadbeef-IN",
  accountId: AccountIdSchema.parse(DEFAULT_ACCOUNT_ID),
  assetId: CryptoCurrencyIdSchema.parse("ethereum"),
  hash: "0xdeadbeef",
  type: "IN",
  value: BigNumberStrSchema.parse("1000000000000000000"),
  fee: BigNumberStrSchema.parse("21000000000000"),
  senders: ["0xdef"],
  recipients: ["0xabc"],
  blockHeight: 19_000_000,
  date: DateTimeIsoSchema.parse("2026-01-31T12:00:00.000Z"),
  ...overrides,
});
