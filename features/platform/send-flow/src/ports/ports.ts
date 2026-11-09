import type { SendFeatures } from "../descriptor/features";
import type { SendAccount, SendAccountBridge, SendAccountLike, SendTransaction } from "../registry";
import type { SponsoredCoinApi } from "../sponsored/coinApi";
import type { SponsoredSendIntent } from "../sponsored/useSponsoredSendSession";

export type SendFlowAccountSyncRequest = Readonly<{
  accountId: string;
  priority: number;
  reason: string;
}>;

/** What the Send flow needs from the host's coin layer, supplied once through `SendFlowPortsProvider`. */
export type SendFlowPorts = Readonly<{
  sendFeatures: SendFeatures;
  /** Must return the same promise for the same account family: hooks read it with React `use()`. */
  getAccountBridge(
    account: SendAccountLike,
    parentAccount?: SendAccount | null,
  ): Promise<SendAccountBridge>;
  applyMemoToTransaction(
    family: string,
    memoValue: string | number | undefined,
    memoType?: string | null,
    currentTransaction?: Record<string, unknown>,
  ): Record<string, unknown>;
  addRecentAddress(currencyId: string, address: string, ensName?: string): void;
  useAccountSync(): (request: SendFlowAccountSyncRequest) => void;
  getSponsoredCoinApi(network: string, kind: string): Promise<SponsoredCoinApi | null>;
  buildSponsoredIntent(
    family: string,
    kind: string,
    account: SendAccount,
    transaction: SendTransaction,
  ): Promise<SponsoredSendIntent>;
}>;
