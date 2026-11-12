import type { MockReaders } from "../families/types";
import { receive } from "./receive";
import { accountStatus } from "./accountStatus";
import { assetStatus } from "./assetStatus";
import { balance } from "./balance";
import { balanceHistory } from "./balanceHistory";
import { operations } from "./operations";

/** The generic reader of each kind, for the families that do not answer it their own way. */
export const kinds: MockReaders = {
  balance,
  operations,
  balanceHistory,
  receive,
  accountStatus,
  assetStatus,
};
