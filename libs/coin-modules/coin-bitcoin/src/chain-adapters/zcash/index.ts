import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ChainAdapter } from "../types";
import type { SignerContext } from "../../signer";
import type { Transaction } from "../../types";
import { registerChainAdapter } from "../registry";
import type { ZcashAccount, ZcashAccountRaw, ZcashTransaction } from "./types";
import { isShieldedTransfer } from "./types";
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

  signOperation(
    _account: Account,
    _deviceId: string,
    transaction: Transaction,
    _signerContext: SignerContext,
  ) {
    const tx = transaction as ZcashTransaction;
    if (!isShieldedTransfer(tx)) return undefined;

    // TODO: implement PCZT signing for shielded transactions
    throw new Error("Zcash shielded signOperation not yet implemented");
  },

  getTransactionStatus(_account: Account, transaction: Transaction) {
    const tx = transaction as ZcashTransaction;
    if (!isShieldedTransfer(tx)) return undefined;

    // TODO: implement shielded transaction validation + ZIP-317 fee estimation
    throw new Error("Zcash shielded getTransactionStatus not yet implemented");
  },

  estimateMaxSpendable(
    _account: Account,
    _parentAccount: Account | null | undefined,
    transaction: Transaction | null | undefined,
  ) {
    const tx = transaction as ZcashTransaction | null | undefined;
    if (!tx || !isShieldedTransfer(tx)) return undefined;

    // TODO: implement shielded balance estimation
    throw new Error("Zcash shielded estimateMaxSpendable not yet implemented");
  },

  prepareTransaction(_account: Account, transaction: Transaction) {
    const tx = transaction as ZcashTransaction;
    if (!isShieldedTransfer(tx)) return undefined;

    // TODO: implement shielded transaction preparation (ZIP-317 fee info)
    throw new Error("Zcash shielded prepareTransaction not yet implemented");
  },
};

registerChainAdapter(zcashChainAdapter);
