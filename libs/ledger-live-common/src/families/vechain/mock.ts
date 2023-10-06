import type { Account } from "@ledgerhq/types-live";

function postSyncAccount(account: Account): Account {
  return account;
}

function postScanAccount(account: Account): Account {
  return account;
}

export default {
  postSyncAccount,
  postScanAccount,
};
