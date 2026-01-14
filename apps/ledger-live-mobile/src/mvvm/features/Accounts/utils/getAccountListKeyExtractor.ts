import { AccountLike } from "@ledgerhq/types-live";

export default function getAccountListKeyExtractor(account: AccountLike) {
  return account.id;
}
