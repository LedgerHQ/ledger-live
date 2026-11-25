import {
  createSigningRequests,
  PredictionsAccountNotFound,
  type PredictionsSigningRequest as SigningRequest,
} from "@features/platform-predictions";
import { getAccountIdFromWalletAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { Account } from "@ledgerhq/types-live";

export type PredictionsSigningRequest = SigningRequest<Account>;

// Kept apart from the root, which GlobalDialogs loads lazily, so the live app player doesn't pull it in.
export const predictionsSigningRequests = createSigningRequests<Account>();

export function findPredictionsAccount(accounts: Account[], walletAccountId: string): Account {
  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  const account = accounts.find(candidate => candidate.id === accountId);
  if (account?.currency.family !== "evm") {
    throw new PredictionsAccountNotFound(`No EVM account ${walletAccountId}`);
  }
  return account;
}
