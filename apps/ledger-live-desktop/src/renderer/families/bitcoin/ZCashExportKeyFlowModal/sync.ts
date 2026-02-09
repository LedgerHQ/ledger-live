import { ZcashAccount, ZcashPrivateInfo } from "@ledgerhq/coin-bitcoin/lib/types";
import { updateAccountWithUpdater, UpdateAccountAction } from "~/renderer/actions/accounts";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/zcash-shielded/constants";

export const syncStateUpdater = (
  account: ZcashAccount,
  info: Partial<ZcashPrivateInfo>,
): UpdateAccountAction =>
  updateAccountWithUpdater(account?.id || "", currentAccount => {
    const zcashAccount = currentAccount as ZcashAccount;
    const existingPrivateInfo = zcashAccount.privateInfo || DEFAULT_ZCASH_PRIVATE_INFO;
    const nextPrivateInfo: ZcashPrivateInfo = {
      ...existingPrivateInfo,
      ...info,
    };
    return {
      ...zcashAccount,
      privateInfo: nextPrivateInfo,
    };
  });
