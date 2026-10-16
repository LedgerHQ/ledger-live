import type { AssetInfo, BalanceOptions } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { UnexpectedGetBalanceError } from "@ledgerhq/coin-module-framework/errors";
import type { Account } from "@ledgerhq/types-live";
import { A4Client } from "./a4/client/index";
import { deriveA4AccountId } from "./a4/client/accountId";
import { fetchA4Operations } from "./a4/client/operations";
import { ensureA4Registered } from "./a4/client/registration";
import { toA4Network, resolveA4BaseUrl } from "./a4/client/utils";
import { toA4HttpError } from "./a4/client/errors";
import { resolveA4ChainConfig } from "./a4/config";
import { logA4 } from "./a4/log";
import { resolveOperationHistoryBound } from "./operationHistoryBound";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { getAccountModuleShape } from "./accountModule";
import { assembleAccountShape } from "./assembly";
import { listedOperations, walkListing } from "./assembly/operations";
import { addressAccountId, isSyncFromScratch, tokensSyncHash } from "./assembly/syncHash";
import { readsValidators, toValidatorItems } from "./assembly/validators";
import { readFamilyData } from "./familyReads";
import { coinModuleChainReads } from "./legacyChainReads";
import { isPortfolioEnabledFor } from "./portfolio/config";
import { getPortfolioAccountShape } from "./portfolio/shape";
import { getAccountRawAssignHooks } from "./accountRawAssign";
import { adaptCoreOperationToLiveOperation } from "./utils";
import type { CoinFrameworkSigner, OperationCommon } from "./types";
import { CurrencyRegionRestrictedError } from "../../errors";
import { isRegionRestrictedFailure } from "./regionRestriction";

// A4 being intentionally off for a chain is a per-chain steady-state config fact, not a per-sync
// event: logged once per chain per process, same reasoning as loggedReadDecisions below.
const loggedRegisterOffChains = new Set<string>();

async function registerWithA4(currencyId: string, address: string): Promise<void> {
  const a4Network = toA4Network(currencyId);
  if (a4Network === null) {
    return;
  }

  const { register, environment } = resolveA4ChainConfig(a4Network);
  if (!register) {
    if (!loggedRegisterOffChains.has(a4Network)) {
      loggedRegisterOffChains.add(a4Network);
      logA4({
        level: "info",
        message: "A4 registration is off for this chain",
        decision: "register_off_intentional",
        chain: a4Network,
      });
    }
    return;
  }

  try {
    const a4AccountId = deriveA4AccountId(address);
    const url = resolveA4BaseUrl(environment);
    const client = new A4Client(url, a4Network);
    await ensureA4Registered(client, a4AccountId, [address], a4Network);
  } catch (e) {
    logA4({
      level: "error",
      message: `A4 registration setup failed unexpectedly: ${e instanceof Error ? e.message : String(e)}`,
      decision: "register_setup_error",
      chain: a4Network,
      error: e,
    });
  }
}

// Read-vs-delegate is a per-chain steady-state fact, not a per-sync event: logging it every sync
// (syncs run frequently) would violate the "not spammy for common paths" requirement, so it's
// logged once per chain per process instead.
const loggedReadDecisions = new Set<string>();

function logReadDecisionOnce(chain: string, decision: string, message: string): void {
  const key = `${chain}:${decision}`;
  if (loggedReadDecisions.has(key)) {
    return;
  }
  loggedReadDecisions.add(key);
  logA4({ level: "info", message, decision, chain });
}

/**
 * The balance options of a resumed sync: the family's own, plus the assets the account already
 * holds (`knownAssets`) and the height its scan resumes from (`scanAssetsMinHeight`), so the module
 * scans from the watermark instead of the whole history and still returns a balance for a token
 * last moved below it.
 *
 * No options at all unless the family declares some: coin-tron and coin-casper wrap their
 * `getBalance` in `rejectBalanceOptions`, which throws on any truthy value, `{}` included. Declaring
 * `balanceOptions` is what marks a family as accepting the parameter, and evm is today the only one
 * whose module reads these two fields. Checked before deriving `knownAssets`, not after: a family
 * that doesn't declare `balanceOptions` never uses that list, and `getAssetFromToken` is not
 * guaranteed not to throw on every family that happens to declare it (coin-tron does, for its own
 * reasons).
 *
 * The list is a filtered view -- the family's `includeAssets` keeps only CAL-resolvable tokens --
 * but that filter is hashed into `syncHash`, so the day a token becomes listed the hash changes, the
 * sync goes from scratch, and scans from 0 with no `knownAssets`. Completeness therefore holds by
 * induction within one hash generation.
 *
 * All or nothing: the module reads `knownAssets` as *every* asset already held, and scans only from
 * `scanAssetsMinHeight` on that assumption. A stored sub-account that failed to convert (a throwing
 * `getAssetFromToken` included: it must not fail the whole sync over one sub-account) would be
 * missing from that list, and if it hasn't moved since the watermark, from the scanned window too:
 * gone from the balance response entirely, not merely stale. A conversion failure falls back to a
 * full scan instead.
 *
 * Assigned onto a typed object, never spread into a literal: a spread escapes excess-property
 * checking, so this would compile against a framework without the fields and ship as a silent no-op.
 */
function resumedBalanceOptions(
  { balanceOptions, getAssetFromToken }: Pick<BridgeApi, "balanceOptions" | "getAssetFromToken">,
  initialAccount: Account | undefined,
  address: string,
  minHeight: number,
): BalanceOptions | undefined {
  if (!balanceOptions || minHeight === 0) return balanceOptions;

  const rawKnownAssets = (initialAccount?.subAccounts ?? []).map(sub => {
    try {
      return getAssetFromToken?.(sub.token, address);
    } catch {
      return undefined;
    }
  });
  const knownAssets = rawKnownAssets.filter((asset): asset is AssetInfo => asset !== undefined);
  if (!knownAssets.length || knownAssets.length !== rawKnownAssets.length) return balanceOptions;

  const scoped: BalanceOptions = { ...balanceOptions };
  scoped.knownAssets = knownAssets;
  scoped.scanAssetsMinHeight = minHeight;
  return scoped;
}

export function genericGetAccountShape(
  network: string,
  kind: string,
  signer?: CoinFrameworkSigner,
): GetAccountShape {
  return async (info, syncConfig) => {
    const { address, initialAccount, currency } = info;
    const coinModuleApi = await getCoinModuleApi(currency.id, kind);
    const context = buildContext(currency.id);
    const bridgeApi = await getBridgeApi(currency, network);

    const chainSpecificValidation = bridgeApi.getChainSpecificRules;
    if (chainSpecificValidation) {
      chainSpecificValidation.getAccountShape(address);
    }

    // The coin config of the currency serves its accounts through the portfolio layer.
    if (isPortfolioEnabledFor(currency.id)) {
      const { fromOperationExtraRaw } = await getAccountRawAssignHooks(network);
      return getPortfolioAccountShape(info, syncConfig, {
        bridgeApi,
        coinModuleApi,
        context,
        signer,
        reviveFamilyExtra: fromOperationExtraRaw,
        bound: resolveOperationHistoryBound(currency.id, network),
      });
    }

    // The account is served by an account module, which owns its addresses (ADR-064 Option 1).
    if (bridgeApi.accountModule) {
      if (!signer) throw new Error(`No signer to sync a ${network} account`);
      return getAccountModuleShape(bridgeApi.accountModule, info, {
        api: coinModuleApi,
        context,
        signerContext: signer.context,
      });
    }

    // The family hooks read the chain through these only: the coin module, and the reads the family
    // makes beyond it on this path.
    const chain = coinModuleChainReads(
      coinModuleApi,
      context,
      bridgeApi.legacyChainReads?.(currency, coinModuleApi, context),
    );
    const accountId = addressAccountId(info, bridgeApi);
    const syncHash = await tokensSyncHash(currency.id, syncConfig, bridgeApi);
    // Resume position across syncs: `minHeight` alone, derived from the newest stored operation.
    // It is non-volatile by construction and already persisted, unlike a module cursor (coin-hypercore
    // documents its own as volatile). Only the cursor varies from page to page below.
    const minHeight = isSyncFromScratch(initialAccount, syncHash)
      ? 0
      : (initialAccount?.operations?.[0]?.blockHeight ?? 0) + 1;

    void registerWithA4(currency.id, address);

    const balanceOptions = resumedBalanceOptions(bridgeApi, initialAccount, address, minHeight);
    const readBalance = (options: BalanceOptions | undefined) =>
      coinModuleApi.getBalance(context, address, options).catch(async err => {
        // The config rejects when the currency has none, which is not a region restriction.
        const config = await context.config().catch(() => undefined);
        if (isRegionRestrictedFailure(err, config)) {
          throw new CurrencyRegionRestrictedError(currency.name, err);
        }
        throw new UnexpectedGetBalanceError("", err);
      });
    const balancePromise = readBalance(balanceOptions);

    // The family's own reads (`buildAccountShape` and its `getAccountInfo` included, the account
    // sequence) fail the sync when they reject: what a family contributes may be fields its screens
    // require, which the framework cannot tell. Validators and readiness are optional enrichments,
    // kept when they fail.
    const [block, balances, validators, family] = await Promise.all([
      coinModuleApi.lastBlock(context),
      balancePromise,
      readsValidators(bridgeApi)
        ? coinModuleApi
            .getValidators(context)
            .then(page => toValidatorItems(page.items))
            .catch(() => [])
        : [],
      readFamilyData(bridgeApi, chain, currency, address),
    ]);

    const a4Network = toA4Network(currency.id);
    const a4ChainConfig = a4Network ? resolveA4ChainConfig(a4Network) : null;

    // Resolved once per sync, keyed on `currency.id` (not the coin-framework `network` family
    // key) so a remote payload written in the same per-currency key space as every other config
    // in this framework actually matches. A bound always resolves -- the shipped default is a
    // measured safety ceiling, not `undefined` -- and a remote payload can only lower it, never
    // raise or disable it. The walk bound protects sync-time memory and traffic; the store bound
    // the assembly applies after `mergeOps` (parent and per-sub-account) protects persistence and
    // stability across syncs -- bounding only the walk would still let the stored history grow
    // sync after sync, since `minHeight` resumes from the newest stored operation and `mergeOps`
    // appends.
    const bound = resolveOperationHistoryBound(currency.id, network);

    // delegateNewOps is lazy: getAccountRawAssignHooks is only awaited when the coin-module path is taken
    const delegateNewOps = async (): Promise<{
      operations: OperationCommon[];
      bounded: boolean;
    }> => {
      // NFT and failed-incoming operations are dropped per page, before the bound counts them (the
      // A4 adapter does it on its own reads).
      const { items: coreOps, bounded } = await walkListing(
        options => coinModuleApi.listOperations(context, address, options),
        minHeight,
        bound,
      );
      // Same hooks the persist/restore path uses, so the family bag on a freshly-synced operation
      // ends up in the shape a restored one has — the family's `fromOperationExtraRaw` is the
      // single definition of it. Loaded per sync rather than per operation; the registry caches the import.
      const { fromOperationExtraRaw: reviveFamilyExtra } = await getAccountRawAssignHooks(network);
      const operations = listedOperations(coreOps).map(op =>
        adaptCoreOperationToLiveOperation(accountId, op, reviveFamilyExtra),
      ) as OperationCommon[];
      return { operations, bounded };
    };

    let newOperations: OperationCommon[];
    // True when this round's walk (A4 or delegate, whichever served it) stopped on the bound
    // before finding out whether it reached back to `minHeight`: the assembly then carries nothing
    // older over (see `ChainSnapshot.bounded`).
    let bounded: boolean;

    if (a4Network && a4ChainConfig?.read) {
      try {
        const url = resolveA4BaseUrl(a4ChainConfig.environment);
        const a4Client = new A4Client(url, a4Network);
        const a4AccountId = deriveA4AccountId(address);
        // NFT and failed-incoming filtering is handled inside adaptA4OperationToLiveOperation (returns [])
        const a4Result = await fetchA4Operations(a4Client, a4AccountId, {
          liveAccountId: accountId,
          address,
          chain: a4Network,
          minHeight,
          maxDcRoamRetries: a4ChainConfig.maxDcRoamRetries,
          // Both bounds the delegate gets: the walk bound, without which a large A4-backed
          // account materialises its whole history before the store bound runs, and the page
          // size, without which a single response can do the same on its own.
          maxOperations: bound.maxOperations,
          pageSize: bound.pageSize,
        });
        newOperations = a4Result.operations as OperationCommon[];
        bounded = a4Result.bounded;
        logReadDecisionOnce(a4Network, "read_served_by_a4", "A4 is serving reads for this chain");
      } catch (e) {
        const status = toA4HttpError(e).status;
        // The fallback is deliberate even for a malformed A4 history: the delegate rewalks from
        // the coin module, so what gets persisted is a complete history from another source, not
        // a fragment. What it must not do is read as a network blip -- an A4 walk that stalls its
        // cursor is a defect in A4, and the log has to say so or nobody goes looking.
        const integrity = e instanceof Error && e.name === "PaginationIntegrityError";
        const errorMessage = e instanceof Error ? e.message : String(e);
        logA4({
          level: "warn",
          message: integrity
            ? `A4 returned a malformed history, falling back to delegate: ${errorMessage}`
            : `A4 read failed, falling back to delegate: ${errorMessage}`,
          decision: integrity ? "read_failover_integrity" : "read_failover_to_delegate",
          chain: a4Network,
          status,
          error: e,
        });
        ({ operations: newOperations, bounded } = await delegateNewOps());
      }
    } else {
      if (a4Network) {
        logReadDecisionOnce(
          a4Network,
          "read_off_intentional",
          "A4 read is off for this chain, delegate is used",
        );
      }
      ({ operations: newOperations, bounded } = await delegateNewOps());
    }

    return assembleAccountShape(
      {
        info,
        syncConfig,
        bridgeApi,
        chain,
        accountId,
        syncHash,
        maxOperations: bound.maxOperations,
        // The balance read ran before the walk: a token first received in between is read again,
        // from the same scan height, for a family that declares `balanceOptions`.
        ...(balanceOptions && {
          readTokenBalances: (assets: AssetInfo[]) =>
            readBalance({
              ...balanceOptions,
              knownAssets: [...(balanceOptions.knownAssets ?? []), ...assets],
            }),
        }),
      },
      { balances, newOperations, bounded, tipHeight: block.height, validators, family },
    );
  };
}
