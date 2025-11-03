import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type { Result } from "@ledgerhq/coin-framework/derivation";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import type {
  GetAccountShape,
  IterateResultBuilder,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId, getSyncHash } from "@ledgerhq/coin-framework/account";
import { listOperations } from "../logic/listOperations";
import { apiClient } from "../network/api";
import type { HederaAccount } from "../types";
import { getSubAccounts, prepareOperations, applyPendingExtras, mergeSubAccounts } from "./utils";

export const getAccountShape: GetAccountShape<HederaAccount> = async (
  info,
  { blacklistedTokenIds },
): Promise<Partial<HederaAccount>> => {
  const { currency, derivationMode, address, initialAccount } = info;

  invariant(address, "an hedera address is expected");

  const liveAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  // get current account balance and tokens
  // tokens are fetched with separate requests to get "created_timestamp" for each token
  // based on this, ASSOCIATE_TOKEN operations can be connected with tokens
  const [mirrorAccount, mirrorTokens] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getAccountTokens(address),
  ]);

  const accountBalance = new BigNumber(mirrorAccount.balance.balance);

  // we should sync again when new tokens are added or blacklist changes

  const syncHash = await getSyncHash(currency.id, blacklistedTokenIds);
  const shouldSyncFromScratch = !initialAccount || syncHash !== initialAccount?.syncHash;

  const oldOperations = initialAccount?.operations ?? [];
  const pendingOperations = initialAccount?.pendingOperations ?? [];

  // grab latest operation's consensus timestamp for incremental sync
  const latestOperation = oldOperations[0];
  const latestOperationTimestamp =
    !shouldSyncFromScratch && latestOperation
      ? new BigNumber(Math.floor(latestOperation.date.getTime() / 1000))
      : null;
  const latestAccountOperations = await listOperations({
    currency,
    address,
    mirrorTokens,
    pagination: {
      minHeight: 0,
      ...(latestOperationTimestamp && { lastPagingToken: latestOperationTimestamp.toString() }),
    },
    fetchAllPages: true,
    skipFeesForTokenOperations: false,
    useEncodedHash: true,
    useSyntheticBlocks: false,
  });

  const newSubAccounts = await getSubAccounts(
    liveAccountId,
    latestAccountOperations.tokenOperations,
    mirrorTokens,
  );
  const subAccounts = mergeSubAccounts(initialAccount, newSubAccounts);
  const newOperations = await prepareOperations(
    latestAccountOperations.coinOperations,
    latestAccountOperations.tokenOperations,
  );
  const enrichedNewOperations = applyPendingExtras(newOperations, pendingOperations);
  const operations = shouldSyncFromScratch
    ? enrichedNewOperations
    : mergeOps(oldOperations, enrichedNewOperations);

  return {
    id: liveAccountId,
    freshAddress: address,
    syncHash,
    lastSyncDate: new Date(),
    balance: accountBalance,
    spendableBalance: accountBalance,
    operations,
    operationsCount: operations.length,
    // NOTE: there are no "blocks" in hedera
    // Set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: 10,
    subAccounts,
    hederaResources: {
      maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
      isAutoTokenAssociationEnabled: mirrorAccount.max_automatic_token_associations === -1,
    },
  };
};

export const buildIterateResult: IterateResultBuilder = async ({ result: rootResult }) => {
  const mirrorAccounts = await apiClient.getAccountsForPublicKey(rootResult.publicKey);
  const addresses = mirrorAccounts.map(a => a.account);

  return async ({ currency, derivationMode, index }) => {
    const derivationScheme = getDerivationScheme({
      derivationMode,
      currency,
    });
    const freshAddressPath = runDerivationScheme(derivationScheme, currency, {
      account: index,
    });

    return addresses[index]
      ? ({
          address: addresses[index],
          publicKey: addresses[index],
          path: freshAddressPath,
        } satisfies Result)
      : null;
  };
};
