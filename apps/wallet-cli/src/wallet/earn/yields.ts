import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getWalletApiIdFromAccountId } from "@ledgerhq/live-common/wallet-api/converters";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyProviders, getDefiProducts, getGrow, getSolanaValidators } from "./api";
import type { CurrencyProvider, DefiProduct, GrowItem } from "./api.types";
import { currencyIdFromNetwork, parseV1, toV0, type Network } from "../../shared/accountDescriptor";
import { normalizeSolanaValidator, type NormalizedSolanaValidator } from "./normalize";
import { isVaultDepositable } from "./eth-vault-policy";
import type { EarnYieldRow } from "./types";

/** Default number of staking validators to surface when `--limit` is not provided. */
export const DEFAULT_STAKE_VALIDATORS_LIMIT = 15;

/**
 * Networks the CLI can actually act on for earn (`earn deposit` supports evm + solana today). The
 * no-network `earn yields` listing is restricted to these; expand as more families are supported.
 */
const SUPPORTED_EARN_NETWORKS = new Set(["ethereum", "solana"]);

type EarnYieldSessionAccount = {
  label: string;
  descriptor: string;
};

export type EarnYieldSession = {
  accounts: ReadonlyArray<EarnYieldSessionAccount>;
};

export type ListEarnYieldRowsArgs = {
  session: EarnYieldSession;
  network?: Network;
  limit: number;
  all?: boolean;
  accountLabel?: string;
};

/** live-common account id (js:2:...) for a session entry, or undefined if it no longer parses. */
function accountIdFor(entry: { descriptor: string }): string | undefined {
  try {
    return toV0(parseV1(entry.descriptor)).id;
  } catch {
    return undefined;
  }
}

/**
 * Wallet-API account id to embed as a deposit deeplink's `accountId` (uuidv5 of the live-common
 * account id, the same id Ledger Live derives for its accounts).
 *
 * For a token deposit_token (a Ledger token id like "ethereum/erc20/usd__coin") this resolves the
 * *token* sub-account under the parent: passing the parent id alone makes the earn app ignore
 * cryptoAssetId and default to another token (e.g. USDC -> USDT). For a native deposit_token it is
 * just the parent account.
 */
export function depositWalletAccountId(
  parentAccountId: string | undefined,
  depositToken: string,
): string | undefined {
  if (!parentAccountId) return undefined;
  const accountId = depositToken.includes("/")
    ? encodeTokenAccountId(parentAccountId, { id: depositToken } as unknown as TokenCurrency)
    : parentAccountId;
  return getWalletApiIdFromAccountId(accountId);
}

/**
 * Network names (env-agnostic, e.g. "ethereum", "solana") the user has discovered accounts for.
 * Used to narrow the no-network listing to what the user actually holds. Unparseable/legacy
 * session descriptors are skipped rather than failing the command.
 */
function discoveredNetworkNames(session: EarnYieldSession): Set<string> {
  const names = new Set<string>();
  for (const entry of session.accounts) {
    try {
      names.add(parseV1(entry.descriptor).network.name);
    } catch {
      // ignore descriptors that no longer parse
    }
  }
  return names;
}

/**
 * Map each network to a parent live-common account id (js:2:...) used to build the deposit
 * deeplink's `accountId`. Default is the first discovered account per network; `--account <label>`
 * overrides its network's entry.
 */
function parentAccountIdsByNetwork(
  session: EarnYieldSession,
  accountLabel?: string,
): Map<string, string> {
  const byNetwork = new Map<string, string>();
  for (const entry of session.accounts) {
    let name: string;
    try {
      name = parseV1(entry.descriptor).network.name;
    } catch {
      continue;
    }
    if (byNetwork.has(name)) continue;
    const id = accountIdFor(entry);
    if (id) byNetwork.set(name, id);
  }

  if (accountLabel) {
    const entry = session.accounts.find(e => e.label === accountLabel);
    if (!entry) {
      throw new Error(
        `No account labeled "${accountLabel}" in session. Run \`account discover\` first.`,
      );
    }
    const id = accountIdFor(entry);
    // Fail fast rather than silently falling back to the first account for the network: the user
    // explicitly selected this label, so an unconvertible descriptor (stale/legacy session entry)
    // must surface as an error instead of embedding the wrong accountId in the deeplinks.
    if (!id) {
      throw new Error(
        `Account "${accountLabel}" could not be resolved from the session (its stored descriptor is outdated). Run \`account discover\` to refresh the session.`,
      );
    }
    byNetwork.set(parseV1(entry.descriptor).network.name, id);
  }

  return byNetwork;
}

/**
 * Build the `ledgerlive://earn/deposit?cryptoAssetId=<id>` deeplink that opens the Earn deposit flow
 * for a given asset in Ledger Live. When a `walletAccountId` is known it is added so the deposit page
 * lands on a real account rather than the live app's fallback.
 */
function growDeeplink(depositToken: string, walletAccountId?: string): string {
  const params = new URLSearchParams({ cryptoAssetId: depositToken });
  if (walletAccountId) params.set("accountId", walletAccountId);
  return `ledgerlive://earn/deposit?${params.toString()}`;
}

/**
 * Build the deeplink that opens Ledger Live's native Solana delegation modal. Solana staking does not
 * go through a live app, so `earn/deposit` is wrong for SOL.
 */
export function solanaStakeDeeplink(walletAccountId?: string): string {
  if (!walletAccountId) return "ledgerlive://earn?action=stake";
  const params = new URLSearchParams({ action: "stake-account", accountId: walletAccountId });
  return `ledgerlive://earn?${params.toString()}`;
}

function growItemToRow(item: GrowItem, parentAccountIds: Map<string, string>): EarnYieldRow {
  const walletAccountId = depositWalletAccountId(
    parentAccountIds.get(item.network),
    item.deposit_token,
  );
  return {
    network: item.network,
    provider: item.provider,
    depositToken: item.deposit_token,
    interestType: item.interest.type,
    interestValue: item.interest.value,
    deeplink:
      item.network === "solana"
        ? solanaStakeDeeplink(walletAccountId)
        : growDeeplink(item.deposit_token, walletAccountId),
  };
}

/**
 * Serialize a single `queryParams` value for a URL search param. Objects are JSON-encoded (rather
 * than falling back to the useless `[object Object]`); everything else stringifies normally.
 */
function queryParamValue(value: unknown): string {
  return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

/**
 * Build the `ledgerlive://discover/<liveAppId>` deeplink that opens a provider's live app, with the
 * provider's `queryParams` serialized as URL search params. Array values are appended once per entry;
 * nullish values are skipped.
 */
function providerDeeplink(liveAppId: string, queryParams?: Record<string, unknown>): string {
  const base = `ledgerlive://discover/${encodeURIComponent(liveAppId)}`;
  if (!queryParams) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(queryParams)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, queryParamValue(item));
    } else {
      search.append(key, queryParamValue(value));
    }
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

function providerToRow(provider: CurrencyProvider, network: string): EarnYieldRow {
  return {
    network,
    provider: provider.name,
    depositToken: network,
    interestType: "APY",
    interestValue: provider.apy === undefined ? "" : String(provider.apy / 100),
    providerId: provider.id,
    category: provider.category,
    apy: provider.apy,
    min: provider.min,
    liveAppId: provider.liveAppId,
    deeplink: providerDeeplink(provider.liveAppId, provider.queryParams),
  };
}

/**
 * Map a /v1/defi/products vault to a yield row. `vaultId` is the value `earn deposit --product`
 * expects for EVM vaults.
 */
export function vaultToRow(product: DefiProduct, network: string): EarnYieldRow {
  const rate = product.totalNrr ?? product.nrr;
  return {
    network,
    provider: product.provided_by ?? "Kiln",
    depositToken: product.asset_symbol ?? product.currency ?? network,
    interestType: "NRR",
    interestValue: rate === undefined ? "" : String(rate / 100),
    vaultId: product.id,
    productName: product.display_name ?? product.name,
    depositable: true,
  };
}

/**
 * Map a Solana validator to a yield row. `validator` (the vote account) is the value
 * `earn deposit --product` expects for Solana staking.
 */
export function validatorToRow(
  validator: NormalizedSolanaValidator,
  network: string,
): EarnYieldRow {
  return {
    network,
    provider: validator.name ?? "Solana validator",
    depositToken: network,
    interestType: "APY",
    interestValue: validator.apy === undefined ? "" : String(validator.apy),
    validator: validator.voteAccount,
    productName: validator.name ?? undefined,
    commission: validator.commission ?? undefined,
    depositable: true,
  };
}

/**
 * Order the validators worth surfacing for staking and cap to `limit`. Ledger-operated validators
 * come first (matching Ledger Live's ledger-first ordering); remaining non-delinquent validators
 * follow, ranked by score.
 */
export function selectStakeValidators(
  validators: NormalizedSolanaValidator[],
  limit: number,
): NormalizedSolanaValidator[] {
  const live = validators.filter(v => v.delinquent !== true);
  const byScoreDesc = (a: NormalizedSolanaValidator, b: NormalizedSolanaValidator) =>
    (b.score ?? 0) - (a.score ?? 0);
  const isLedger = (v: NormalizedSolanaValidator) =>
    (v.name ?? "").trim().toLowerCase().startsWith("ledger");

  const ledger = live.filter(isLedger).sort(byScoreDesc);
  const others = live.filter(v => !isLedger(v)).sort(byScoreDesc);

  return [...ledger, ...others].slice(0, limit);
}

/**
 * Deposit-target rows for a network: the concrete ids `earn deposit --product` accepts.
 *   ethereum -> EVM vaults (vault id)
 *   solana   -> validator vote accounts
 * Only meaningful on mainnet; the backing lists are mainnet-only.
 */
async function depositProductRows(network: Network, limit: number): Promise<EarnYieldRow[]> {
  if (network.env !== "main") return [];

  if (network.name === "solana") {
    const validators = (await getSolanaValidators()).map(normalizeSolanaValidator);
    return selectStakeValidators(validators, limit).map(v => validatorToRow(v, network.name));
  }

  if (network.name === "ethereum") {
    const products = await getDefiProducts();
    return products
      .filter(isVaultDepositable)
      .slice(0, limit)
      .map(p => vaultToRow(p, network.name));
  }

  return [];
}

export async function listEarnYieldRows({
  session,
  network,
  limit,
  all = false,
  accountLabel,
}: ListEarnYieldRowsArgs): Promise<EarnYieldRow[]> {
  const grow = await getGrow({ dashboardSupported: true });
  const parentAccountIds = parentAccountIdsByNetwork(session, accountLabel);

  if (network) {
    const growRows = grow
      .filter(item => item.network === network.name)
      .map(item => growItemToRow(item, parentAccountIds));

    const currencyId = currencyIdFromNetwork(network);
    const providers = await getCurrencyProviders(currencyId);
    const providerRows = providers.filter(p => p.active).map(p => providerToRow(p, network.name));
    const productRows = await depositProductRows(network, limit);

    return [...growRows, ...providerRows, ...productRows];
  }

  let items = grow.filter(item => SUPPORTED_EARN_NETWORKS.has(item.network));

  if (!all) {
    const discovered = discoveredNetworkNames(session);
    if (discovered.size > 0) {
      items = items.filter(item => discovered.has(item.network));
    }
  }

  return items.map(item => growItemToRow(item, parentAccountIds));
}
