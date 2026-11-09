import { suiPublicKeyMatchesAddress } from "@ledgerhq/coin-sui/signer/publicKey";
import type { Account } from "@ledgerhq/types-live";
import { AccountPublicKeyUnavailable } from "../../errors";
import type { AccountPublicKeyResolver } from "../../coin-modules/types";

/**
 * xpub holds the raw Ed25519 public key (hex) saved at scan. Accounts added before that have none,
 * and the user must re-add them.
 */
const resolveSuiAccountPublicKey: AccountPublicKeyResolver<Account> = account => {
  if (account.xpub && suiPublicKeyMatchesAddress(account.xpub, account.freshAddress)) {
    return account.xpub;
  }
  throw new AccountPublicKeyUnavailable();
};

export default resolveSuiAccountPublicKey;
