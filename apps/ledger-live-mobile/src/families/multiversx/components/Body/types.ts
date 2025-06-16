import type { MultiversXAccount } from "@ledgerhq/live-common/families/multiversx/types";
import type { AccountLike } from "@ledgerhq/types-live";

export interface BodyPropsType {
  account: MultiversXAccount;
}

export interface WithBodyPropsType {
  account: AccountLike;
}
