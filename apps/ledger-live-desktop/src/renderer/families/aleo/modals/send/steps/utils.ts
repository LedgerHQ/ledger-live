import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AccountLike } from "@ledgerhq/types-live";
export const isAleoAccount = (acc: AccountLike): acc is AleoAccount => "aleoResources" in acc;
