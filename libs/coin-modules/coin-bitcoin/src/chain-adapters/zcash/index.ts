import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ChainAdapter } from "../types";
import type { SignerContext } from "../../signer";
import type { Transaction } from "../../types";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw } from "./types";
import { toZcashPrivateInfoRaw, fromZcashPrivateInfoRaw } from "./serialization";
import { buildExtraSyncObservable } from "./sync";

const zcashChainAdapter: ChainAdapter = {
  id: "zcash",

  // ── Sync ────────────────────────────────────────────────────────────

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

  // ── Transaction ─────────────────────────────────────────────────────
  // All Zcash transactions (transparent + shielded) will use PCZT.
  // Until PCZT is implemented, returning undefined falls back to Bitcoin legacy path.

  signOperation(
    _account: Account,
    _deviceId: string,
    _transaction: Transaction,
    _signerContext: SignerContext,
  ) {
    // TODO: implement PCZT signing for all Zcash transactions
    return undefined;
  },

  getTransactionStatus(_account: Account, _transaction: Transaction) {
    // TODO: implement PCZT transaction validation + ZIP-317 fee estimation
    return undefined;
  },

  estimateMaxSpendable(
    _account: Account,
    _parentAccount: Account | null | undefined,
    _transaction: Transaction | null | undefined,
  ) {
    // TODO: implement PCZT balance estimation
    return undefined;
  },

  prepareTransaction(_account: Account, _transaction: Transaction) {
    // TODO: implement PCZT transaction preparation (ZIP-317 fee info)
    return undefined;
  },
};

registerChainAdapter(zcashChainAdapter);
