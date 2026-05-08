import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ChainAdapter } from "../types";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw } from "./types";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";

const zcashChainAdapter: ChainAdapter = {
  id: "zcash",

  buildExtraSyncObservable,

  assignToAccountRaw(account: Account, accountRaw: AccountRaw) {
    const zcashAccount = account as ZcashAccount;
    if (zcashAccount.privateInfo) {
      (accountRaw as ZcashAccountRaw).privateInfo = toZcashPrivateInfoRaw(zcashAccount.privateInfo);
    }
  },

  assignFromAccountRaw(accountRaw: AccountRaw, account: Account) {
    const zcashPrivateInfoRaw = (accountRaw as ZcashAccountRaw).privateInfo;
    if (zcashPrivateInfoRaw) {
      (account as ZcashAccount).privateInfo = fromZcashPrivateInfoRaw(zcashPrivateInfoRaw);
    }
  },
};

registerChainAdapter(zcashChainAdapter);
