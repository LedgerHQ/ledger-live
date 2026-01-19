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
import { HARDCODED_BLOCK_HEIGHT } from "../constants";
import { toEVMAddress } from "../logic/utils";
import { listOperations } from "../logic";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccount } from "../network/utils";
import type { HederaAccount } from "../types";
import { getSubAccounts, prepareOperations, applyPendingExtras, mergeSubAccounts } from "./utils";

export const getAccountShape: GetAccountShape<HederaAccount> = async (
  info,
  { blacklistedTokenIds },
): Promise<Partial<HederaAccount>> => {
  const { currency, derivationMode, address, initialAccount } = info;
  invariant(address, "hedera: address is expected");
  const evmAddress = await toEVMAddress({ currency, accountId: address });
  invariant(evmAddress, "hedera: evm address is missing");

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
  const [mirrorAccount, mirrorTokens, erc20Tokens] = await Promise.all([
    apiClient.getAccount({ currency, address }),
    apiClient.getAccountTokens({ currency, address }),
    getERC20BalancesForAccount({ currency, address }),
  ]);

  const accountBalance = new BigNumber(mirrorAccount.balance.balance);

  // we should sync again when new tokens are added or blacklist changes
  const syncHash = await getSyncHash(currency.id, blacklistedTokenIds);
  const shouldSyncFromScratch = !initialAccount || syncHash !== initialAccount?.syncHash;

  const pendingOperations = shouldSyncFromScratch ? [] : initialAccount?.pendingOperations ?? [];
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const latestOperation = oldOperations[0];

  // grab latest operation timestamps for incremental sync
  let latestOperationTimestamp: string | null = null;

  if (!shouldSyncFromScratch && latestOperation) {
    const timestamp = Math.floor(latestOperation.date.getTime() / 1000);
    latestOperationTimestamp = new BigNumber(timestamp).toFixed(9);
  }

  const latestAccountOperations = await listOperations({
    currency,
    address,
    evmAddress,
    mirrorTokens,
    erc20Tokens,
    pagination: {
      minHeight: 0,
      ...(latestOperationTimestamp && { lastPagingToken: latestOperationTimestamp }),
    },
    fetchAllPages: true,
    skipFeesForTokenOperations: false,
    useEncodedHash: true,
    useSyntheticBlocks: false,
  });

  const newOperations = await prepareOperations(
    latestAccountOperations.coinOperations,
    latestAccountOperations.tokenOperations,
  );
  const enrichedNewOperations = applyPendingExtras(newOperations, pendingOperations);
  const operations = shouldSyncFromScratch
    ? enrichedNewOperations
    : mergeOps(oldOperations, enrichedNewOperations);

  const delegation =
    typeof mirrorAccount.staked_node_id === "number"
      ? {
          nodeId: mirrorAccount.staked_node_id,
          delegated: accountBalance,
          pendingReward: new BigNumber(mirrorAccount.pending_reward),
        }
      : null;

  const newSubAccounts = await getSubAccounts({
    ledgerAccountId: liveAccountId,
    latestTokenOperations: latestAccountOperations.tokenOperations,
    mirrorTokens,
    erc20Tokens,
  });

  const subAccounts = shouldSyncFromScratch
    ? newSubAccounts
    : mergeSubAccounts(initialAccount, newSubAccounts);

  return {
    id: liveAccountId,
    freshAddress: address,
    syncHash,
    lastSyncDate: new Date(),
    balance: accountBalance,
    spendableBalance: accountBalance,
    operations: operations,
    operationsCount: operations.length,
    // NOTE: there are no "blocks" in hedera
    // set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: HARDCODED_BLOCK_HEIGHT,
    subAccounts,
    hederaResources: {
      maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
      isAutoTokenAssociationEnabled: mirrorAccount.max_automatic_token_associations === -1,
      delegation,
    },
  };
};

export const buildIterateResult: IterateResultBuilder = async ({ result: rootResult }) => {
  return async ({ currency, derivationMode, index }) => {
    const mirrorAccounts = await apiClient.getAccountsForPublicKey({
      currency,
      publicKey: rootResult.publicKey,
    });

    const addresses = mirrorAccounts.map(a => a.account);
    const derivationScheme = getDerivationScheme({ derivationMode, currency });
    const freshAddressPath = runDerivationScheme(derivationScheme, currency, { account: index });

    return addresses[index]
      ? ({
          address: addresses[index],
          publicKey: addresses[index],
          path: freshAddressPath,
        } satisfies Result)
      : null;
  };
};
