export const LKRP_APPLICATION_ID = 17;

/** Ledger Sync's own LKRP application id (NTTVS-728) — distinct from wallet-cli's `ring` (17) so
 * the two never share a trustchain application, per docs/ledger-sync/02-trustchain-sdk.md. */
export const LEDGER_SYNC_APPLICATION_ID = 16;

export const MEMBER_NAME_MAX_LENGTH = 64;
