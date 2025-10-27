export const TOKEN_OUTPUT_FIELDS = [
  "id",
  "name",
  "ticker",
  "contract_address",
  "standard",
  "decimals",
  "units",
  "delisted",
  "token_identifier", // Only needed for Cardano native assets (LIVE-22559)
  "live_signature",
] as const;
