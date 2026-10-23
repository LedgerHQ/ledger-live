import type { AccountTarget } from "@domain/api-account-data";
import type { AccountDataKind, AccountDataResult } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Random } from "../random";

/** What a mock reader answers from: the account, its currency, and draws seeded by the account and the kind. */
export type MockContext = {
  readonly target: AccountTarget;
  readonly currency: CryptoCurrency;
  readonly random: Random;
};

export type MockReader<K extends AccountDataKind> = (context: MockContext) => AccountDataResult<K>;

export type MockReaders = { readonly [K in AccountDataKind]?: MockReader<K> };

export type MockFamily = {
  /** The `index`th mock account of the currency; the index is the account level of the path. */
  descriptor(currency: CryptoCurrency, index: number, random: Random): AccountDescriptor;
  /** The kinds this family answers its own way, instead of the generic readers of `kinds/`. */
  readonly read?: MockReaders;
};
