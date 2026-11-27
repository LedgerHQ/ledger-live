import BigNumber from "bignumber.js";
import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
import { type GetAccountShape, mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Operation } from "@ledgerhq/types-live";
import { nonNegativeInt, positiveInt, boolean } from "../tuning";
import {
  getAccountBalance,
  getAccountsByPublicKey,
  getConsensusInfo,
} from "../network/proxyClient";
import { listOperations } from "../logic/history/listOperations";
import { paginateOperations } from "../logic/history/paginate";
import type {
  ConcordiumAccount,
  ConcordiumContext,
  ConcordiumResources,
  PltAccountToken,
  RawOperation,
} from "../types";
import { attachSubOperations, splitPaidFee } from "./operations";
import { mapRawOperationToBridgeOperation } from "./serialization";
import { HISTORY_VERSION, REFETCH_SYNC_HASH, TOKENS_OFF_SYNC_HASH } from "./syncHash";
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
  context: ConcordiumContext,
  address: string,
): Promise<{
  balance: BigNumber;
  spendableBalance: BigNumber;
  accountTokens: PltAccountToken[] | undefined;
}> {
  const { finalizedBalance: { accountAmount, accountAtDisposal, accountTokens } = {} } =
    await getAccountBalance(context, address).catch(error => {
      context.logger(
        "concordium-sync",
        `Error fetching balance for account with address ${address}`,
        {
          error,
        },
      );
      return { finalizedBalance: undefined };
    });

  const balance = valueToBigNumber(accountAmount);

  let spendableBalance = accountAtDisposal
    ? valueToBigNumber(accountAtDisposal)
    : balance.minus(nonNegativeInt("minReserve", (await context.config()).minReserve));
  spendableBalance = spendableBalance.isNegative() ? new BigNumber(0) : spendableBalance;

  // Normalised rather than passed through, so the declared type holds.
  return {
    balance,
    spendableBalance,
    accountTokens: Array.isArray(accountTokens) ? accountTokens : undefined,
  };
}

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
  context: ConcordiumContext,
  currencyId: string,
  enableTokens: boolean,
  blacklistedTokenIds: string[] | undefined,
  previous: string | undefined,
): Promise<string> {
  if (!enableTokens) return TOKENS_OFF_SYNC_HASH;

  try {
    return `${await getSyncHash(currencyId, blacklistedTokenIds)}:tokens=on:${HISTORY_VERSION}`;
  } catch (error) {
    context.logger("concordium-sync", "Could not read the CAL sync hash, keeping the stored one", {
      error,
    });
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
  context: ConcordiumContext,
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

  const config = await context.config();
  const limit = positiveInt("gateway.maxTxQuery", config.gateway?.maxTxQuery);
  const items = await paginateOperations(cursor =>
    listOperations(context, address, {
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

/** Takes a context pinned to the config resolved once for this sync, shared with `postSync`. */
export const makeGetAccountShape =
  (context: ConcordiumContext): GetAccountShape<ConcordiumAccount> =>
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

    const config = await context.config();
    const enableTokens = boolean("enableTokens", config.enableTokens);

    try {
      const accountsResponse = await getAccountsByPublicKey(context, publicKey);

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
        context,
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
        getBalance(context, account.address),
        syncOperations(context, account.address, accountId, initialAccount?.operations ?? [], {
          enableTokens,
          refetchAll,
        }),
        getConsensusInfo(context)
          .then(consensus => consensus.lastFinalizedBlockHeight)
          .catch(() => 0),
      ]);

      const resolvedTokens = await resolveTokenSubAccounts(context, {
        enableTokens,
        calLookupConcurrency: config.tokens?.calLookupConcurrency,
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
      context.logger(
        "concordium-sync",
        `Error fetching account shape for public key ${publicKey}`,
        {
          error,
        },
      );

      throw error;
    }
  };
