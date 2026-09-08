import BigNumber from "bignumber.js";
import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import coinConfig from "../config";
import {
  getAccountBalance,
  getAccountsByPublicKey,
  getConsensusInfo,
} from "../network/proxyClient";
import { listOperations } from "../logic/history/listOperations";
import type {
  ConcordiumAccount,
  ConcordiumResources,
  PltAccountToken,
  RawOperation,
} from "../types";
import { mergeOperations } from "./operations";
import { mapRawOperationToBridgeOperation } from "./serialization";
import {
  applyTokensToResources,
  buildParentOperation,
  resolveTokenSubAccounts,
  subAccountsPatch,
} from "./tokens";

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

const TOKENS_OFF_SYNC_HASH = "tokens=off";

/**
 * Stored in place of the computed hash by a sync that fetched PLT transfers it
 * could not attribute, so that the next sync mismatches and re-reads from
 * height zero.
 *
 * A CAL outage is the one case that echoes this value back rather than
 * mismatching, deferring the re-read. That costs nothing: attributing those
 * transfers needs the CAL that is down, and the first healthy sync computes a
 * real hash, mismatches, and picks them up.
 */
const REFETCH_SYNC_HASH = "refetch-pending";

/**
 * Names the assumptions the stored history was built under. Operations are the
 * one thing a sync does not re-derive, so PLT transfers dropped while the flag
 * was off would stay behind the watermark once it went on. Both flag states are
 * represented; preserving the stored hash through the off state, as coin-aleo
 * does, would let the round trip go unnoticed.
 *
 * The off state is a constant so the CAL is never consulted while the feature
 * is off, and a CAL failure while it is on keeps the stored hash rather than
 * invalidating on a transient outage.
 */
async function computeSyncHash(
  currencyId: string,
  enableTokens: boolean,
  blacklistedTokenIds: string[] | undefined,
  previous: string | undefined,
): Promise<string> {
  if (!enableTokens) return TOKENS_OFF_SYNC_HASH;

  try {
    return `${await getSyncHash(currencyId, blacklistedTokenIds)}:tokens=on`;
  } catch (error) {
    log("concordium-sync", "Could not read the CAL sync hash, keeping the stored one", { error });
    return previous ?? TOKENS_OFF_SYNC_HASH;
  }
}

/**
 * Fetches this account's operations and separates the two kinds it can hold.
 * The token half is returned unmapped: attributing it needs the sub-account id,
 * and that needs a CAL lookup this layer does not perform.
 *
 * With tokens off, PLT transfers are discarded outright rather than reduced to
 * their fee; `syncHash` covers the flag, so turning it on re-reads from zero.
 */
export async function syncOperations(
  currencyId: string,
  address: string,
  accountId: string,
  oldOperations: Operation[],
  { enableTokens, refetchAll = false }: { enableTokens: boolean; refetchAll?: boolean },
): Promise<{ operations: Operation[]; pltOperations: RawOperation[] }> {
  const lastBlockHeight = oldOperations[0]?.blockHeight ?? 0;
  const minHeight = refetchAll || lastBlockHeight === 0 ? 0 : lastBlockHeight + 1;

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
    return { items: [] as RawOperation[], next: undefined };
  });

  const nativeItems: RawOperation[] = [];
  const pltOperations: RawOperation[] = [];

  for (const op of result.items) {
    if (op.tokenId === undefined) {
      nativeItems.push(op);
    } else if (enableTokens) {
      pltOperations.push(op);
    }
  }

  const newOperations = [
    ...nativeItems.map(op => mapRawOperationToBridgeOperation(op, accountId)),
    ...pltOperations.map(op => buildParentOperation(op, accountId)),
  ];

  return { operations: mergeOperations(oldOperations, newOperations), pltOperations };
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

    const syncHash = await computeSyncHash(
      currency.id,
      config.enableTokens,
      syncConfig?.blacklistedTokenIds,
      initialAccount?.syncHash,
    );

    // Lowers the watermark rather than dropping what is stored: a fetch returns
    // one page, so discarding first would truncate a longer history to it.
    const refetchAll = initialAccount !== undefined && initialAccount.syncHash !== syncHash;

    const [
      { balance, spendableBalance, accountTokens },
      { operations, pltOperations },
      blockHeight,
    ] = await Promise.all([
      getBalance(currency.id, account.address),
      syncOperations(currency.id, account.address, accountId, initialAccount?.operations ?? [], {
        enableTokens: config.enableTokens,
        refetchAll,
      }),
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
      pltOperations,
      ...(syncConfig?.blacklistedTokenIds
        ? { blacklistedTokenIds: syncConfig.blacklistedTokenIds }
        : {}),
    });

    const unattributed =
      resolvedTokens.kind !== "cleared" && resolvedTokens.unattributedOperations === true;

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
      syncHash: unattributed ? REFETCH_SYNC_HASH : syncHash,
      used: true,
      xpub: publicKey,
    };
  } catch (error) {
    log("concordium-sync", `Error fetching account shape for public key ${publicKey}`, { error });

    throw error;
  }
};
