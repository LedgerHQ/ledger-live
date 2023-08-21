import type { ElrondAccount } from "@ledgerhq/live-common/families/elrond/types";
import type { AccountLike } from "@ledgerhq/types-live";

export interface BodyPropsType {
  account: ElrondAccount;
}

export interface WithBodyPropsType {
  account: AccountLike;
}
