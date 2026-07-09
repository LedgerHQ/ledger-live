/**
 * Centralized, override-able endpoint configuration for the Ledger Earn backend.
 *
 * Keeping the hosts here (rather than inline in `api.ts`) isolates URL/config concerns from the
 * request client so callers depend on named helpers, not hard-coded hosts. All three URLs point at
 * the production `earn.api.live.ledger.com` host and follow the same lightweight `process.env`
 * override convention used elsewhere in wallet-cli config.
 */

const DEFAULT_EARN_API_BASE_URL = "https://earn.api.live.ledger.com";

// Ledger's mainnet Solana validators list, mirroring the URL coin-solana uses (carries stake +
// commission, but NO APY). Lives on the earn API host. Override with the SOLANA_VALIDATORS_URL env.
const DEFAULT_SOLANA_VALIDATORS_URL = `${DEFAULT_EARN_API_BASE_URL}/v0/network/solana/validator-details`;

// Figment validators summary — APY keyed by vote account, merged into the validators list above.
// Same payload coin-solana consumes, but hosts differ by default: coin-solana's
// SOLANA_VALIDATORS_SUMMARY_BASE_URL points at earn-dashboard staging, whereas wallet-cli reads it
// from the production earn API host. Override with the SOLANA_VALIDATOR_APY_URL env var.
const DEFAULT_SOLANA_VALIDATOR_APY_URL = `${DEFAULT_EARN_API_BASE_URL}/figment/solana/validators_summary`;

/** Resolved earn API base URL. Override with the EARN_API_BASE_URL env var. */
export function getEarnApiBaseUrl(): string {
  let base = process.env.EARN_API_BASE_URL || DEFAULT_EARN_API_BASE_URL;
  while (base.endsWith("/")) base = base.slice(0, -1);
  return base;
}

/** Resolved Solana validators list URL. Override with the SOLANA_VALIDATORS_URL env var. */
export function getSolanaValidatorsUrl(): string {
  return process.env.SOLANA_VALIDATORS_URL || DEFAULT_SOLANA_VALIDATORS_URL;
}

/**
 * Resolved Solana validator APY (Figment summary) URL.
 *
 * Callers go through this helper rather than referencing the endpoint directly, so the host stays
 * defined in one place. Override with the SOLANA_VALIDATOR_APY_URL env var.
 */
export function getSolanaValidatorApyUrl(): string {
  return process.env.SOLANA_VALIDATOR_APY_URL || DEFAULT_SOLANA_VALIDATOR_APY_URL;
}
