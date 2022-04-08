import type {
  SubAccount,
  Account,
  CryptoCurrency,
  SyncConfig,
} from "../../types";
import type { Core, CoreAccount } from "../types";
import byFamily from "../../generated/libcore-buildSubAccounts";
export async function buildSubAccounts(arg: {
  core: Core;
  currency: CryptoCurrency;
  coreAccount: CoreAccount;
  accountId: string;
  existingAccount: Account | null | undefined;
  syncConfig: SyncConfig;
  logId?: number;
}): Promise<SubAccount[] | null | undefined> {
  const f = byFamily[arg.currency.family];

  if (f) {
    const res = await f(arg);
    return res;
  }
}
