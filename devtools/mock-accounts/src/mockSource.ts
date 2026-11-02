import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import {
  AccountDataSourceIdSchema,
  type AccountDataKind,
  type AccountDataQuery,
  type AccountDataResult,
} from "@domain/entity-account-data";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { familyOf } from "./families";
import { kinds } from "./kinds";
import { operationCountOf } from "./operationCounts";
import { seededRandom } from "./random";

/** The family's reader of the kind if it has one, else the generic one; draws seeded by the account and the kind. */
function read<K extends AccountDataKind>(
  kind: K,
  target: AccountTarget,
  query: AccountDataQuery<K> | undefined,
): AccountDataResult<K> {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(target.descriptor.network));
  const family = familyOf(currency);
  const reader = family.read?.[kind] ?? kinds[kind];
  if (!reader) throw new Error(`No mock reader for ${kind}`);
  return reader(
    {
      target,
      currency,
      family,
      random: seededRandom(`${target.accountUUID}:${kind}`),
      balances: () => read("balance", target, undefined),
      operationCount: operationCountOf(target.accountUUID),
    },
    query,
  );
}

const answer = <K extends AccountDataKind>(
  kind: K,
  target: AccountTarget,
  query: AccountDataQuery<K> | undefined,
) => Promise.resolve().then(() => read(kind, target, query));

/** Serves the `mock` descriptors only (real sources never see them), each kind derived from the descriptor alone. One line per kind. */
export const mockSource: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("mock"),
  purposes: ["mock"],
  supports: () => true,
  read: {
    balance: (target, query) => answer("balance", target, query),
    operations: (target, query) => answer("operations", target, query),
  },
};
