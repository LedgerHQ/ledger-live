import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape<Account> = async _infos => {
  return {};
};

export const sync = makeSync({
  getAccountShape,
});
