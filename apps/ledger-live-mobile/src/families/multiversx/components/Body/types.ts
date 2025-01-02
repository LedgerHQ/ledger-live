import type { MultiversxAccount } from "@ledgerhq/live-common/families/multiversx/types";
import type { AccountLike } from "@ledgerhq/types-live";

export interface BodyPropsType {
  account: MultiversxAccount;
}

export interface WithBodyPropsType {
  account: AccountLike;
}
