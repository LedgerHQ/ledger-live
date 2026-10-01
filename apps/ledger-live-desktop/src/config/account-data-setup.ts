import { createAccountDataRouter, type AccountDataExtra } from "@domain/api-account-data-source";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import { FullSyncSource } from "@features/platform-account-source-full-sync";

/** The app's sources, in rank order. Spread into the thunk `extraArgument`. */
export function accountDataExtra(): AccountDataExtra {
  return { accountData: createAccountDataRouter([new CoinModuleSource(), new FullSyncSource()]) };
}
