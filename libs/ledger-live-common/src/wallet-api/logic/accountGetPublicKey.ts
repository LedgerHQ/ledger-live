import { Account } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { getMainAccount, getParentAccount } from "../../account/index";
import { normalizePublicKeyForAddress } from "@ledgerhq/coin-tezos/utils";
import type { CosmosAccount } from "@ledgerhq/coin-cosmos/types/index";
import { AccountPublicKeyUnavailable } from "../../errors";
import { WalletAPIContext } from "./context";

type AccountPublicKeyResolver = (account: Account) => string | null;

const ACCOUNT_PUBLIC_KEY_RESOLVERS: Partial<Record<string, AccountPublicKeyResolver>> = {
  // xpub holds the account public key (generic-coin-framework), either hex (as returned by the
  // Ledger app) or already base58. Normalize it to base58; throw the dedicated error when it
  // cannot be resolved so the caller can prompt the user to re-add the account.
  tezos: account => {
    const publicKey = normalizePublicKeyForAddress(account.xpub ?? undefined, account.freshAddress);
    if (publicKey) return publicKey;
    throw new AccountPublicKeyUnavailable();
  },
  // cosmos seedIdentifier is seed-level (shared across accounts), so the per-account
  // compressed pubkey (hex) is persisted in cosmosResources at scan time.
  cosmos: account => (account as CosmosAccount).cosmosResources?.publicKey || null,
};

export const accountGetPublicKeyLogic = async (
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
): Promise<string> => {
  tracking.accountGetPublicKeyRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.accountGetPublicKeyFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);
  if (account === undefined) {
    tracking.accountGetPublicKeyFail(manifest);
    throw new Error("account not found");
  }

  let mainAccount;
  try {
    mainAccount = getMainAccount(account, getParentAccount(account, accounts));
  } catch {
    tracking.accountGetPublicKeyFail(manifest);
    throw new Error("account not found");
  }

  let publicKey: string | null | undefined;
  try {
    publicKey = ACCOUNT_PUBLIC_KEY_RESOLVERS[mainAccount.currency.family]?.(mainAccount);
  } catch (error) {
    // A resolver may throw a typed error (e.g. tezos AccountPublicKeyUnavailable) to signal a
    // recoverable "re-add the account" state; record the failure before propagating it.
    tracking.accountGetPublicKeyFail(manifest);
    throw error;
  }
  if (!publicKey) {
    tracking.accountGetPublicKeyFail(manifest);
    throw new Error("account.getPublicKey not implemented");
  }

  tracking.accountGetPublicKeySuccess(manifest);
  return publicKey;
};
