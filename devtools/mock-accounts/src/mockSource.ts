import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import {
  AccountDataSourceIdSchema,
  type AccountDataKind,
  type AccountDataResult,
} from "@domain/entity-account-data";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { familyOf } from "./families";
import { kinds } from "./kinds";
import { seededRandom } from "./random";

/** The family's reader of the kind if it has one, else the generic one; draws seeded by the account and the kind. */
function answer<K extends AccountDataKind>(
  kind: K,
  target: AccountTarget,
): Promise<AccountDataResult<K>> {
  return Promise.resolve().then(() => {
    const currency = getCryptoCurrencyById(currencyIdFromNetwork(target.descriptor.network));
    const reader = familyOf(currency).read?.[kind] ?? kinds[kind];
    if (!reader) throw new Error(`No mock reader for ${kind}`);
    return reader({ target, currency, random: seededRandom(`${target.accountUUID}:${kind}`) });
  });
}

/** Serves the `mock` descriptors only (real sources never see them), each kind derived from the descriptor alone. One line per kind. */
export const mockSource: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("mock"),
  purposes: ["mock"],
  supports: () => true,
  read: {
    balance: target => answer("balance", target),
  },
};
