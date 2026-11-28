import BigNumber from "bignumber.js";
import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import {
  DEFAULT_CAL_LOOKUP_CONCURRENCY,
  DEFAULT_ENABLE_TOKENS,
  DEFAULT_MAX_TX_QUERY,
  DEFAULT_MIN_RESERVE,
} from "../constants";
import { tuning } from "../tuning";
import {
  getAccountBalance,
  getAccountsByPublicKey,
  getConsensusInfo,
} from "../network/proxyClient";
import { listOperations } from "../logic/history/listOperations";
import { paginateOperations } from "../logic/history/paginate";
import type {
  ConcordiumAccount,
  ConcordiumCoinConfig,
  ConcordiumResources,
  PltAccountToken,
  RawOperation,
} from "../types";
import { attachSubOperations, splitPaidFee } from "./operations";
import { mapRawOperationToBridgeOperation } from "./serialization";
import {
  applyTokensToResources,
  buildParentOperation,
  effectiveSubAccounts,
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
  config: ConcordiumCoinConfig,
  address: string,
): Promise<{
  balance: BigNumber;
  spendableBalance: BigNumber;
  accountTokens: PltAccountToken[] | undefined;
}> {
  const { finalizedBalance: { accountAmount, accountAtDisposal, accountTokens } = {} } =
    await getAccountBalance(config, address).catch(error => {
      log("concordium-sync", `Error fetching balance for account with address ${address}`, {
        error,
      });
      return { finalizedBalance: undefined };
    });

  const balance = valueToBigNumber(accountAmount);
  const minReserve = config.minReserve ?? DEFAULT_MIN_RESERVE;

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

/**
 * Bumped when the parser starts keeping or revaluing rows it read differently,
 * so every stored history is re-read once. 2: aliases of the account matched.
 * 3: every row that cost or moved CCD kept.
 *
 * A token whose CAL unit, decimals or balance cannot be trusted during that
 * re-read keeps its stored rows, and nothing re-reads them later: LIVE-41804.
 */
const HISTORY_VERSION = "history=3";

const TOKENS_OFF_SYNC_HASH = `tokens=off:${HISTORY_VERSION}`;

/**
 * Stored by a sync that fetched PLT transfers it could not attribute, so the
 * next one mismatches and re-reads from height zero.
 *
 * It stays set for as long as the cause lasts. The causes are transient by
 * construction — a balance response without its token list, a CAL that will not
 * answer — so the re-read repeats while the fault does and stops when it lifts.
 * Anything permanent is kept out of this marker at the `tokens.ts` end.
 */
const REFETCH_SYNC_HASH = "refetch-pending";

/**
 * Names the assumptions the stored history was built under. Both flag states
 * are represented, because preserving the stored hash through the off state (as
 * coin-aleo does) would let a round trip go unnoticed.
 *
 * The off state is a constant so the CAL is never consulted while the feature
 * is off, and a failure while it is on keeps the stored hash rather than
 * invalidating on an outage.
 */
async function computeSyncHash(
  currencyId: string,
  enableTokens: boolean,
  blacklistedTokenIds: string[] | undefined,
  previous: string | undefined,
): Promise<string> {
  if (!enableTokens) return TOKENS_OFF_SYNC_HASH;

  try {
    return `${await getSyncHash(currencyId, blacklistedTokenIds)}:tokens=on:${HISTORY_VERSION}`;
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
 * Every page is walked, incrementally as well as on a re-read: stopping at the
 * first would strand anything older behind the watermark.
 *
 * With tokens off, PLT transfers are discarded outright rather than reduced to
 * their fee; `syncHash` covers the flag, so turning it on re-reads from zero.
 */
export async function syncOperations(
  config: ConcordiumCoinConfig,
  address: string,
  accountId: string,
  oldOperations: Operation[],
  { enableTokens, refetchAll = false }: { enableTokens: boolean; refetchAll?: boolean },
): Promise<{ operations: Operation[]; pltOperations: RawOperation[] }> {
  const lastBlockHeight = oldOperations[0]?.blockHeight ?? 0;
  // Reading from zero and discarding are one decision: the walk is a superset of
  // what was stored only when it started at the bottom.
  const fromScratch = refetchAll || lastBlockHeight === 0;
  const minHeight = fromScratch ? 0 : lastBlockHeight + 1;

  const limit = tuning(config.gateway?.maxTxQuery, DEFAULT_MAX_TX_QUERY, 1);
  const items = await paginateOperations(cursor =>
    listOperations(config, address, {
      minHeight,
      limit,
      order: "desc",
      ...(cursor ? { cursor } : {}),
    }),
  );

  const nativeItems: RawOperation[] = [];
  const pltOperations: RawOperation[] = [];

  for (const op of items) {
    if (op.tokenId === undefined) {
      nativeItems.push(op);
    } else if (enableTokens) {
      pltOperations.push(op);
    }
  }

  const newOperations = [
    ...nativeItems.flatMap(splitPaidFee).map(op => mapRawOperationToBridgeOperation(op, accountId)),
    ...pltOperations.map(op => buildParentOperation(op, accountId)),
  ];

  // Keeping the old copies would resurrect operations this parser no longer
  // produces: an id embeds the type, so a retyped row does not replace its old copy.
  return { operations: mergeOps(fromScratch ? [] : oldOperations, newOperations), pltOperations };
}

/** Takes the config resolved once for this sync, shared with `postSync`. */
export const makeGetAccountShape =
  (config: ConcordiumCoinConfig): GetAccountShape<ConcordiumAccount> =>
  async (info, syncConfig) => {
    const { currency, derivationMode, derivationPath, index, initialAccount, rest = {} } = info;

    const publicKey = rest.publicKey || initialAccount?.concordiumResources?.publicKey;

    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: publicKey,
      derivationMode,
    });

    const enableTokens = (config.enableTokens ?? DEFAULT_ENABLE_TOKENS) === true;

    try {
      const accountsResponse = await getAccountsByPublicKey(config, publicKey);

      if (!accountsResponse?.length) {
        // An account that does not exist on chain holds no tokens, so this is
        // authoritative: clear rather than preserve.
        //
        // Its operations are not: nothing removes a transaction from the chain, so
        // an empty list here is a fault rather than news, and `shouldMergeOps` is
        // off, meaning whatever this returns is what the account keeps.
        const storedOperations = initialAccount?.operations ?? [];

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
          operations: storedOperations,
          operationsCount: storedOperations.length,
          spendableBalance: new BigNumber(0),
          used: false,
          xpub: publicKey,
        };
      }

      const account = accountsResponse[0];

      const syncHash = await computeSyncHash(
        currency.id,
        enableTokens,
        syncConfig?.blacklistedTokenIds,
        initialAccount?.syncHash,
      );

      const refetchAll = initialAccount !== undefined && initialAccount.syncHash !== syncHash;

      const [
        { balance, spendableBalance, accountTokens },
        { operations, pltOperations },
        blockHeight,
      ] = await Promise.all([
        getBalance(config, account.address),
        syncOperations(config, account.address, accountId, initialAccount?.operations ?? [], {
          enableTokens,
          refetchAll,
        }),
        getConsensusInfo(config)
          .then(consensus => consensus.lastFinalizedBlockHeight)
          .catch(() => 0),
      ]);

      const resolvedTokens = await resolveTokenSubAccounts({
        enableTokens,
        // A batch of zero would look up nothing and drop every stored token.
        calLookupConcurrency: tuning(
          config.tokens?.calLookupConcurrency,
          DEFAULT_CAL_LOOKUP_CONCURRENCY,
          1,
        ),
        currencyId: currency.id,
        accountId,
        accountTokens,
        initialAccount,
        pltOperations,
        refetchAll,
        ...(syncConfig?.blacklistedTokenIds
          ? { blacklistedTokenIds: syncConfig.blacklistedTokenIds }
          : {}),
      });

      const unattributed =
        resolvedTokens.kind !== "cleared" && resolvedTokens.unattributedOperations === true;

      const subAccounts = effectiveSubAccounts(resolvedTokens, initialAccount?.subAccounts);

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
        operations: attachSubOperations(operations, subAccounts),
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
