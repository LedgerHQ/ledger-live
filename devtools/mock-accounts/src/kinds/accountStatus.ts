import { AccountStatusSchema } from "@domain/entity-account-status";
import type { MockReader } from "../families/types";

/** Used once it holds an asset: the mock history has operations exactly for the assets with a balance. A mock account is never gated. */
export const accountStatus: MockReader<"accountStatus"> = ({ balances }) =>
  AccountStatusSchema.parse({ used: balances().some(row => row.balance !== "0"), gate: null });
