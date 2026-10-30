import type { AccountTarget } from "@domain/api-account-data";
import type {
  AccountDataKind,
  AccountDataQuery,
  AccountDataResult,
} from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Random } from "../random";

/** What a mock reader answers from: the account, its currency and family, and draws seeded by the account and the kind. */
export type MockContext = {
  readonly target: AccountTarget;
  readonly currency: CryptoCurrency;
  readonly family: MockFamily;
  readonly random: Random;
  /** The account's `balance` kind, as the source answers it. */
  readonly balances: () => AccountDataResult<"balance">;
  /** The operation count asked in the tool for this account, if any. */
  readonly operationCount?: number;
};

export type MockReader<K extends AccountDataKind> = (
  context: MockContext,
  query: AccountDataQuery<K> | undefined,
) => AccountDataResult<K>;

export type MockReaders = { readonly [K in AccountDataKind]?: MockReader<K> };

export type MockFamily = {
  /** The `index`th mock account of the currency; the index is the account level of the path. */
  descriptor(currency: CryptoCurrency, index: number, random: Random): AccountDescriptor;
  /** An address of the currency: a sender or recipient of a mock operation. */
  address(currency: CryptoCurrency, random: Random): string;
  /** The kinds this family answers its own way, instead of the generic readers of `kinds/`. */
  readonly read?: MockReaders;
};
