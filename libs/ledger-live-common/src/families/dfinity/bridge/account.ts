import { makeSync } from "../../../bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { getAccountShape } from "./utils/account";

const sync = makeSync({ getAccountShape });

export const accountBridge: Partial<AccountBridge<Transaction>> = {
  sync,
};
