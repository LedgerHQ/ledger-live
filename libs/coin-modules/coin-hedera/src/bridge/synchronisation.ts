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
import type { Account, Operation } from "@ledgerhq/types-live";
import { toEVMAddress } from "../logic/utils";
import { listOperations } from "../logic";
import { apiClient } from "../network/api";
import { thirdwebClient } from "../network/thirdweb";
import { getERC20BalancesForAccount } from "../network/utils";
import type { HederaAccount } from "../types";
import {
  getSubAccounts,
  prepareOperations,
  applyPendingExtras,
  mergeSubAccounts,
  integrateERC20Operations,
} from "./utils";

export const getAccountShape: GetAccountShape<HederaAccount> = async (
  info,
  { blacklistedTokenIds },
): Promise<Partial<HederaAccount>> => {
  const { currency, derivationMode, address, initialAccount } = info;
  invariant(address, "hedera: address is expected");
  const evmAddress = await toEVMAddress(address);
  invariant(evmAddress, `hedera: evm address is missing for ${address}`);

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
  const [mirrorAccount, mirrorTokens, erc20TokenBalances] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getAccountTokens(address),
    getERC20BalancesForAccount(evmAddress),
  ]);

  const accountBalance = new BigNumber(mirrorAccount.balance.balance);

  // we should sync again when new tokens are added or blacklist changes

  const syncHash = await getSyncHash(currency.id, blacklistedTokenIds);
  const shouldSyncFromScratch = !initialAccount || syncHash !== initialAccount?.syncHash;

  const pendingOperations = shouldSyncFromScratch ? [] : initialAccount?.pendingOperations ?? [];
  const oldOperations = shouldSyncFromScratch ? [] : initialAccount?.operations ?? [];
  const oldERC20Operations = oldOperations.filter(item => item.standard === "erc20");
  const latestOperation = oldOperations[0];
  const erc20LatestOperation = oldERC20Operations[0];
  const pendingOperationHashes = new Set(pendingOperations.map(op => op.hash));
  const erc20OperationHashes = new Set(oldERC20Operations.map(op => op.hash));

  // grab latest operation timestamps for incremental sync
  let latestOperationTimestamp: string | null = null;
  let erc20LatestOperationTimestamp: string | null = null;

  if (!shouldSyncFromScratch && latestOperation) {
    const timestamp = Math.floor(latestOperation.date.getTime() / 1000);
    latestOperationTimestamp = new BigNumber(timestamp).toString();
  }

  if (!shouldSyncFromScratch && erc20LatestOperation) {
    const timestamp = Math.floor(erc20LatestOperation.date.getTime() / 1000);
    erc20LatestOperationTimestamp = new BigNumber(timestamp).toString();
  }

  const [latestAccountOperations, erc20Transactions] = await Promise.all([
    listOperations({
      currency,
      address,
      mirrorTokens,
      cursor: latestOperationTimestamp?.toString(),
      fetchAllPages: true,
      skipFeesForTokenOperations: false,
      useEncodedHash: true,
      useSyntheticBlocks: false,
    }),
    thirdwebClient.getERC20TransactionsForAccount({
      address,
      contractAddresses: erc20TokenBalances.map(token => token.token.contractAddress),
      since: erc20LatestOperationTimestamp,
    }),
  ]);

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

  // how ERC20 operations are handled:
  // - mirror node doesn't include "IN" erc20 token transactions
  // - mirror node returns "CONTRACT_CALL" (OUT) erc20 token transactions made from given account address
  // - mirror node doesn't return "CONTRACT_CALL" (OUT) erc20 token transactions made from 3rd party with allowance
  //
  // 1. mirror node transactions are already transformed into operations at this point + we have raw erc20 transactions fetched from thirdweb
  // 2. related mirror node transaction must be fetched for each erc20 transaction (to get fee and consensus timestamp)
  // 3. CONTRACTCALL operations must be removed if existing operations already include erc20 operation with the same tx.hash
  // 4. ERC20 transactions must be classified into two groups: patchList and addList
  //    - patchList: transactions which are already present in mirror operations (we can have CONTRACT_CALL from mirror node that we can transform into "FEES")
  //    - addList should include transactions which are missing in mirror operations (e.g. "IN" erc20 token transaction and "OUT" made by 3rd party with allowance)
  // 5. list of all operations must be updated based on prepared `patchList` and `addList`
  // 6. sub accounts must get erc20 tokens and erc20 operations in addition to hts tokens and hts operations
  // 7. postSync must remove pending operations that are already confirmed as erc20 operations
  const { updatedOperations, newERC20TokenOperations } = await integrateERC20Operations({
    ledgerAccountId: liveAccountId,
    address,
    allOperations: operations,
    latestERC20Transactions: erc20Transactions,
    pendingOperationHashes,
    erc20OperationHashes,
  });

  const newSubAccounts = await getSubAccounts({
    ledgerAccountId: liveAccountId,
    latestHTSTokenOperations: latestAccountOperations.tokenOperations,
    latestERC20TokenOperations: newERC20TokenOperations,
    mirrorTokens,
    erc20Tokens: erc20TokenBalances,
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
    operations: updatedOperations,
    operationsCount: updatedOperations.length,
    // NOTE: there are no "blocks" in hedera
    // Set a value just so that operations are considered confirmed according to isConfirmedOperation
    blockHeight: 10,
    subAccounts,
    hederaResources: {
      maxAutomaticTokenAssociations: mirrorAccount.max_automatic_token_associations,
      isAutoTokenAssociationEnabled: mirrorAccount.max_automatic_token_associations === -1,
      delegation,
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

// it might be necessary to remove pending operations after ERC20 patching done by `integrateERC20Operations`
export const postSync = (_initial: Account, synced: Account): Account => {
  const erc20Operations = synced.operations.filter(op => op.standard === "erc20");
  const erc20Hashes = new Set(erc20Operations.map(op => op.hash));

  const excludeConfirmedERC20Operations = (o: Operation) => !erc20Hashes.has(o.hash);

  return {
    ...synced,
    pendingOperations: synced.pendingOperations.filter(excludeConfirmedERC20Operations),
    subAccounts: (synced.subAccounts ?? []).map(subAccount => {
      return {
        ...subAccount,
        pendingOperations: subAccount.pendingOperations.filter(excludeConfirmedERC20Operations),
      };
    }),
  };
};
