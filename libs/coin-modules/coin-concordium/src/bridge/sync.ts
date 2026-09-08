import BigNumber from "bignumber.js";
import { encodeAccountId, getSyncHash } from "@ledgerhq/ledger-wallet-framework/account/index";
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
import { paginateOperations } from "../logic/history/paginate";
import type {
  ConcordiumAccount,
  ConcordiumResources,
  PltAccountToken,
  RawOperation,
} from "../types";
import { attachSubOperations } from "./operations";
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

/** The proxy's documented ceiling; anything larger is silently clamped to it. */
const PAGE_SIZE = 1000;

const TOKENS_OFF_SYNC_HASH = "tokens=off";

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
 * Every page is walked, incrementally as well as on a re-read: stopping at the
 * first would strand anything older behind the watermark.
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
  // Reading from zero and discarding are one decision: the walk is a superset of
  // what was stored only when it started at the bottom.
  const fromScratch = refetchAll || lastBlockHeight === 0;
  const minHeight = fromScratch ? 0 : lastBlockHeight + 1;

  const config = coinConfig.getCoinConfig(currencyId);
  const items = await paginateOperations(cursor =>
    listOperations(
      config,
      address,
      { minHeight, limit: PAGE_SIZE, order: "desc", ...(cursor ? { cursor } : {}) },
      currencyId,
    ),
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
    ...nativeItems.map(op => mapRawOperationToBridgeOperation(op, accountId)),
    ...pltOperations.map(op => buildParentOperation(op, accountId)),
  ];

  // Keeping the old copies would resurrect operations this parser no longer
  // produces, and `sameOp` ignores `hasFailed`, so a stale one would win.
  return { operations: mergeOps(fromScratch ? [] : oldOperations, newOperations), pltOperations };
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
      config.enableTokens,
      syncConfig?.blacklistedTokenIds,
      initialAccount?.syncHash,
    );

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
      refetchAll,
      ...(syncConfig?.blacklistedTokenIds
        ? { blacklistedTokenIds: syncConfig.blacklistedTokenIds }
        : {}),
    });

    const unattributed =
      resolvedTokens.kind !== "cleared" && resolvedTokens.unattributedOperations === true;

    // What the account ends up holding: `unchanged` keeps the stored list, and
    // `cleared` has none, so neither can be read off `resolvedTokens` alone.
    const subAccounts =
      resolvedTokens.kind === "resolved"
        ? resolvedTokens.subAccounts
        : resolvedTokens.kind === "unchanged"
          ? (initialAccount?.subAccounts ?? [])
          : [];

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
