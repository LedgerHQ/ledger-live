import {
  CLI_WRITTEN_VERSION,
  defineAccountsCodec,
  type StoredAccountData,
} from "@features/platform-persistence-accounts";
import { fromAccountRaw, toAccountRaw } from "@ledgerhq/live-common/account/serialization";
import type { Account, AccountRaw } from "@ledgerhq/types-live";

const hasAccountRawShape = (data: StoredAccountData): data is StoredAccountData & AccountRaw =>
  typeof data.seedIdentifier === "string" &&
  typeof data.freshAddress === "string" &&
  Array.isArray(data.operations);

function asAccountRaw(data: StoredAccountData): AccountRaw {
  if (!hasAccountRawShape(data)) throw new TypeError("The stored account is not an AccountRaw");
  return data;
}

/** As the cli does today: it ignores the stored version and writes version 1, with no name. */
export const cliAccountsCodec = defineAccountsCodec({
  decode: ({ data }) => fromAccountRaw(asAccountRaw(data)),
  decodedId: account => account.id,
  encode: async (account: Account) => ({
    data: await toAccountRaw(account),
    version: CLI_WRITTEN_VERSION,
  }),
});
