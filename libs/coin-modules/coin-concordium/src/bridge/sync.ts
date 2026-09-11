import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  getAccountBalance,
  getAccountsByPublicKey,
  getConsensusInfo,
} from "../network/proxyClient";
import { listOperations } from "../logic/history/listOperations";
import type { ConcordiumAccount, ConcordiumResources, PltAccountToken } from "../types";
import { mapRawOperationToBridgeOperation } from "./serialization";
import { applyTokensToResources, resolveTokenSubAccounts, subAccountsPatch } from "./tokens";

const fillConcordiumResources = (
  existing: Partial<ConcordiumResources> = {},
  incoming: Partial<ConcordiumResources> = {},
): ConcordiumResources => ({
  credId: "",
  credNumber: 0,
  identityIndex: 0,
  ipIdentity: 0,
  isOnboarded: false,
  publicKey: "",
  ...existing,
  ...incoming,
});

const valueToBigNumber = (value?: string | number): BigNumber => {
  const result = new BigNumber(value ?? 0);
  return result.isNaN() ? new BigNumber(0) : result;
};

/**
 * Reads the account balance once and reports the PLT list alongside it.
 *
 * `accountTokens` is `undefined` when the fetch failed, the response omitted
 * the field, or it arrived as something other than an array — all three
 * reachable because the response is not schema-checked. Callers must not read
 * that as "holds no tokens": the zeroed balance below is synthetic, and
 * treating the absent list as authoritative would drop the account's token
 * sub-accounts on a single bad response.
 */
export async function getBalance(
  currencyId: string,
  address: string,
): Promise<{
  balance: BigNumber;
  spendableBalance: BigNumber;
  accountTokens: PltAccountToken[] | undefined;
}> {
  const config = coinConfig.getCoinConfig(currencyId);
  const { finalizedBalance: { accountAmount, accountAtDisposal, accountTokens } = {} } =
    await getAccountBalance(config, currencyId, address).catch(error => {
      log("concordium-sync", `Error fetching balance for account with address ${address}`, {
        error,
      });
      return { finalizedBalance: undefined };
    });

  const balance = valueToBigNumber(accountAmount);
  const minReserve = config.minReserve;

  let spendableBalance = accountAtDisposal
    ? valueToBigNumber(accountAtDisposal)
    : balance.minus(minReserve);
  spendableBalance = spendableBalance.isNegative() ? new BigNumber(0) : spendableBalance;

  // Normalised rather than passed through, so the declared type holds.
  return {
    balance,
    spendableBalance,
    accountTokens: Array.isArray(accountTokens) ? accountTokens : undefined,
  };
}

export async function syncOperations(
  currencyId: string,
  address: string,
  accountId: string,
  oldOperations: Operation[],
): Promise<Operation[]> {
  const lastBlockHeight = oldOperations[0]?.blockHeight ?? 0;
  const minHeight = lastBlockHeight > 0 ? lastBlockHeight + 1 : 0;

  const config = coinConfig.getCoinConfig(currencyId);
  const result = await listOperations(
    config,
    address,
    { minHeight, limit: 100, order: "desc" },
    currencyId,
  ).catch(error => {
    log("concordium-sync", `Error fetching operations for account with address ${address}`, {
      error,
    });
    return { items: [] as const, next: undefined };
  });

  const newOperations = result.items.map(op => mapRawOperationToBridgeOperation(op, accountId));
  return mergeOps(oldOperations, newOperations);
}

export const getAccountShape: GetAccountShape<ConcordiumAccount> = async (info, syncConfig) => {
  const { currency, derivationMode, derivationPath, index, initialAccount, rest = {} } = info;

  const publicKey = rest.publicKey || initialAccount?.concordiumResources?.publicKey;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  const config = coinConfig.getCoinConfig(currency.id);

  try {
    const accountsResponse = await getAccountsByPublicKey(config, currency.id, publicKey);

    if (!accountsResponse?.length) {
      // An account that does not exist on chain holds no tokens, so this is
      // authoritative: clear rather than preserve.
      return {
        balance: new BigNumber(0),
        blockHeight: 0,
        subAccounts: [],
        concordiumResources: applyTokensToResources(
          fillConcordiumResources(initialAccount?.concordiumResources, {
            publicKey,
            isOnboarded: false,
          }),
          { kind: "cleared" },
        ),
        derivationMode,
        derivationPath,
        id: accountId,
        index,
        operations: [],
        operationsCount: 0,
        spendableBalance: new BigNumber(0),
        used: false,
        xpub: publicKey,
      };
    }

    const account = accountsResponse[0];

    const [{ balance, spendableBalance, accountTokens }, operations, blockHeight] =
      await Promise.all([
        getBalance(currency.id, account.address),
        syncOperations(currency.id, account.address, accountId, initialAccount?.operations ?? []),
        getConsensusInfo(config, currency.id)
          .then(info => info.lastFinalizedBlockHeight)
          .catch(() => 0),
      ]);

    const resolvedTokens = await resolveTokenSubAccounts({
      enableTokens: config.enableTokens,
      currencyId: currency.id,
      accountId,
      accountTokens,
      initialAccount,
      ...(syncConfig?.blacklistedTokenIds
        ? { blacklistedTokenIds: syncConfig.blacklistedTokenIds }
        : {}),
    });

    return {
      balance,
      blockHeight,
      ...subAccountsPatch(resolvedTokens),
      concordiumResources: applyTokensToResources(
        fillConcordiumResources(initialAccount?.concordiumResources, {
          isOnboarded: true,
          publicKey,
        }),
        resolvedTokens,
      ),
      freshAddress: account.address,
      seedIdentifier: publicKey,
      derivationMode,
      derivationPath,
      id: accountId,
      index,
      operations,
      operationsCount: operations.length,
      spendableBalance,
      used: true,
      xpub: publicKey,
    };
  } catch (error) {
    log("concordium-sync", `Error fetching account shape for public key ${publicKey}`, { error });

    throw error;
  }
};
