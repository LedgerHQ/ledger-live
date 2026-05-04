import { clearAccount as commonClearAccount } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account, AccountLike } from "@ledgerhq/types-live";

// coinClean accepts any Account subtype (e.g. BitcoinAccount) — cast is safe
// because commonClearAccount only calls familyClean on full Account nodes
export const makeClearAccount =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (coinClean?: (account: any) => void) =>
  <T extends AccountLike>(account: T): T =>
    commonClearAccount(account, coinClean as ((account: Account) => void) | undefined);
