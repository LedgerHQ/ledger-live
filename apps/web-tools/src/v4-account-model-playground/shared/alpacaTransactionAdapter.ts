/**
 * Beginning of an adaptor to replace the bridge's way of making transactions
 * (preparing, validating, broadcasting) with Alpaca-style API.
 *
 * Infers what Alpaca provides: prepareTransaction, getTransactionStatus, broadcast
 * (see libs/ledger-live-common/src/bridge/generic-alpaca/). For Alpaca families
 * (evm, xrp, stellar, tezos) the bridge is already getAlpacaAccountBridge(family, "local");
 * this module exposes a small facade so the transactional slice (or UI) can call
 * prepare/validate/broadcast by accountId + getAccount, without depending on
 * getAccountBridge(account) directly. Later we can swap to direct Alpaca API if needed.
 */
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { isAlpacaForAccountId } from "./syncStrategy";
import type { Account, BroadcastConfig } from "@ledgerhq/types-live";

export interface AlpacaTransactionAdapter {
  /** Prepare transaction (fees, etc.) via Alpaca/bridge. */
  prepareTransaction: (account: Account, transaction: unknown) => Promise<unknown>;
  /** Validate transaction status. */
  getTransactionStatus: (account: Account, transaction: unknown) => Promise<unknown>;
  /** Broadcast signed operation. */
  broadcast: (params: {
    account: Account;
    signedOperation: { signature: string; operation: unknown };
    broadcastConfig?: unknown;
  }) => Promise<unknown>;
}

/**
 * Return an adaptor for transaction prepare/validate/broadcast.
 * When account is Alpaca-family, uses the same bridge as getAccountBridge(account)
 * (Alpaca account bridge). Callers pass getAccount so we can resolve Account from
 * accountId (e.g. from slices via reconstructAccountFromReconstructionInput).
 */
export function getAlpacaTransactionAdapter(
  _getAccount?: (accountId: string) => Promise<Account>,
): AlpacaTransactionAdapter {
  return {
    async prepareTransaction(account: Account, transaction: unknown) {
      if (!isAlpacaForAccountId(account.id)) {
        throw new Error("alpacaTransactionAdapter: account is not Alpaca-family");
      }
      const bridge = getAccountBridge(account);
      return bridge.prepareTransaction(account, transaction as never);
    },
    async getTransactionStatus(account: Account, transaction: unknown) {
      if (!isAlpacaForAccountId(account.id)) {
        throw new Error("alpacaTransactionAdapter: account is not Alpaca-family");
      }
      const bridge = getAccountBridge(account);
      return bridge.getTransactionStatus(account, transaction as never);
    },
    async broadcast(params) {
      const { account, signedOperation, broadcastConfig } = params;
      if (!isAlpacaForAccountId(account.id)) {
        throw new Error("alpacaTransactionAdapter: account is not Alpaca-family");
      }
      const bridge = getAccountBridge(account);
      const config: BroadcastConfig = {
        mevProtected: false,
        ...(broadcastConfig as Partial<BroadcastConfig>),
      };
      return bridge.broadcast({
        account,
        signedOperation: signedOperation as never,
        broadcastConfig: config,
      });
    },
  };
}
