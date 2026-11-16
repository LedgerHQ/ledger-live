import {
  createBindingRequests,
  PredictionsBindingAccountNotFound,
  type PredictionsBindingRequest as BindingRequest,
} from "@features/platform-predictions";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { Account } from "@ledgerhq/types-live";

export type PredictionsBindingRequest = BindingRequest<Account>;

// Kept apart from the root, so the live app player doesn't pull in the executor.
export const predictionsBindingRequests = createBindingRequests<Account>();

export function findBindingAccount(accounts: Account[], walletAccountId: string): Account {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  const account = accounts.find(candidate => candidate.id === accountId);
  if (account?.currency.family !== "evm") {
    throw new PredictionsBindingAccountNotFound(`No EVM account ${walletAccountId}`);
  }
  return account;
}
