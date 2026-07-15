/**
 * Earn-owned normalizers.
 *
 * The Earn backend has no generated client, so `api.types.ts` parses responses with permissive,
 * passthrough Zod schemas that mirror the raw payloads (snake_case, nullable, extra fields). That is
 * the right posture AT the boundary, but the rest of the earn code should not depend on those raw
 * shapes. These functions map the parsed payloads into small, stable internal DTOs (camelCase, the
 * fields the CLI actually consumes) so pipeline/command code reads one predictable shape.
 *
 * Normalization is intentionally lossless-but-lazy: optional backend fields stay optional here, and
 * "is this field present?" decisions remain with the caller (e.g. the EVM pipeline only requires
 * `assetDecimals` when an explicit amount is supplied). Nothing here throws.
 */

import type { DefiProduct, DefiTransactionData, SolanaValidatorWithApy } from "./api.types";

/** Stable internal vault-product shape, decoupled from the permissive `/v1/defi/products` payload. */
export type NormalizedDefiProduct = {
  /** Vault id — the canonical `earn deposit --product` key. */
  id: string;
  /** Provider that operates the vault (e.g. "Kiln"). */
  providedBy?: string;
  /** Internal vault name. */
  name?: string;
  /** Human-facing vault name. */
  displayName?: string;
  /** Chain slug (e.g. "eth"). */
  chain?: string;
  /** EVM chain id the vault lives on. */
  chainId?: number;
  /** Asset contract / address field as reported by the backend. */
  address?: string;
  /** Backend lifecycle status (e.g. "paused"); absent means "no explicit status". */
  status?: string;
  /** Alternate vault identifier the backend may key on. */
  vaultId?: string;
  /** ERC-4626 vault contract address (the deposit/redeem target). */
  vault?: string;
  /** ERC-20 asset contract pulled into the vault (the approve target). */
  asset?: string;
  /** Asset ticker, e.g. "USDC". */
  assetSymbol?: string;
  /** Ledger currency/token id for the asset. */
  currency?: string;
  /** Asset decimals used to convert a human amount into base units. */
  assetDecimals?: number;
  /** Net reward rate (percentage, e.g. 3.06 = 3.06%). */
  nrr?: number;
  /** Net reward rate including additional rewards (percentage). */
  totalNrr?: number;
};

/** Map a raw `/v1/defi/products` entry into the stable vault-product shape. */
export function normalizeDefiProduct(raw: DefiProduct): NormalizedDefiProduct {
  return {
    id: raw.id,
    providedBy: raw.provided_by,
    name: raw.name,
    displayName: raw.display_name,
    chain: raw.chain,
    chainId: raw.chain_id,
    address: raw.address,
    status: raw.status,
    vaultId: raw.vault_id,
    vault: raw.vault,
    asset: raw.asset,
    assetSymbol: raw.asset_symbol,
    currency: raw.currency,
    assetDecimals: raw.asset_decimals,
    nrr: raw.nrr,
    totalNrr: raw.totalNrr,
  };
}

/** Stable internal shape for backend-built `/v1/defi/*` calldata (camelCased gas/chain fields). */
export type NormalizedDefiTransaction = {
  /** Wallet the calldata is built for. */
  wallet: string;
  /** Transaction target (asset for approve, vault for deposit/redeem). */
  to: string;
  /** 0x-prefixed calldata body. */
  data: string;
  /** Native value carried by the call (must be zero for ERC-20 vault calls). */
  value: string;
  /** Suggested nonce. */
  nonce: number;
  /** Suggested gas limit. */
  gasLimit: number;
  /** Chain id the calldata is built for. */
  chainId: number;
};

/** Map a raw `/v1/defi/*` calldata payload (`gas_limit`/`chain_id`) into the stable shape. */
export function normalizeDefiTransaction(raw: DefiTransactionData): NormalizedDefiTransaction {
  return {
    wallet: raw.wallet,
    to: raw.to,
    data: raw.data,
    value: raw.value,
    nonce: raw.nonce,
    gasLimit: raw.gas_limit,
    chainId: raw.chain_id,
  };
}

/** Stable internal shape for a Solana validator row enriched with its (optional) merged APY. */
export type NormalizedSolanaValidator = {
  /** Vote account — the canonical `earn deposit --product` key for Solana staking. */
  voteAccount: string;
  /** Validator display name, when known. */
  name?: string;
  /** Commission percentage, when known. */
  commission?: number;
  /** Ranking score used to order validators, when known. */
  score?: number;
  /** Active stake (lamports), when known. */
  activeStake?: number;
  /** Whether the validator is currently delinquent (normalized from a nullable backend flag). */
  delinquent: boolean;
  /** Merged Figment APY as a fraction (0.078 = 7.8%), when available. */
  apy?: number;
};

/** Map a raw validators-list entry (with merged APY) into the stable validator-row shape. */
export function normalizeSolanaValidator(raw: SolanaValidatorWithApy): NormalizedSolanaValidator {
  return {
    voteAccount: raw.vote_account,
    name: raw.name ?? undefined,
    commission: raw.commission ?? undefined,
    score: raw.total_score ?? undefined,
    activeStake: raw.active_stake ?? undefined,
    delinquent: raw.delinquent === true,
    apy: raw.apy,
  };
}
