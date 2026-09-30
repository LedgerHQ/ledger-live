export const ESTIMATION_RECIPIENTS: Record<string, string> = {
  bitcoin: "bc1qed3mqr92zvq2s782aqkyx785u23723w02qfrgs",
  bitcoin_cash: "1mW6fDEMjKrDHvLvoEsaeLxSCzZBf3Bfg",
  bitcoin_gold: "GeTZ7bjfXtGsyEcerSSFJNUSZwLfjtCJX9",
  bitcoin_private: "b1SGV7U5kGAMHtGbkAR3mjaZqVn57SHFbiR",
  bitcoin_testnet: "mkpZhYtJu2r87Js3pDiWJDmPte2NRZ8bJV",
  dash: "XoJA8qE3N2Y3jMLEtZ3vcN42qseZ8LvFf5",
  decred: "DshusByvZ2y4HuUaqkb7LrNTQTrqCjLnBW7",
  digibyte: "DG1KhhBKpsyWXTakHNezaDQ34focsXjN1i",
  dogecoin: "DBus3bamQjgJULBJtYXpEzDWQRwF5iwxgC",
  game_credits: "GJgbzWpGhrZmSvc2V5Npqf57Kg9xfB79tj",
  komodo: "RW8gfgpCUdgZbkPAs1uJQF2S9681JVkGRi",
  litecoin: "LUWPbpM43E2p7ZSh8cyTBEkvpHmr3cB8Ez",
  nix: "GRpn2DPiQxAczMrQFt2sK1CS8EYdnvSHxo",
  qtum: "QPvRe2C17qk24K6v5gTg7CPghZ8b4WMxZP",
  zcash: "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F",
  zclassic: "t1Qmwyih5F7Mw6Vts4tSnXuA2o3NgJPYNgP",
  zcoin: "a1bW3sVVUsLqgKuTMXtSaAHGvpxKwugxPH",
  zencash: "zngWJRgpBa45KUeRuCmdMsqti4ohhe9sVwC",
};

export const getBitcoinEstimationRecipient = (currencyId: string): string => {
  const recipient = ESTIMATION_RECIPIENTS[currencyId];
  if (!recipient) throw new Error(`No estimation recipient for ${currencyId}`);
  return recipient;
};

// ── Module defaults of the optional coin config fields (see config.ts) ──────
//
// The values wallet-btc consumes are defined there, next to their use, and re-exported here.

export { DEFAULT_EXPLORER_BATCH_SIZE } from "@ledgerhq/wallet-btc/explorer/index";
export { DEFAULT_REPLACED_OPERATION_EXPIRY_MS } from "@ledgerhq/wallet-btc/operations";
export { DEFAULT_RBF_MIN_BUMP_RATIO } from "@ledgerhq/wallet-btc/utils";

export const DEFAULT_STUCK_TRANSACTION_TIMEOUT_MS = 20 * 60 * 1000;
export const DEFAULT_FEE_CALCULATION_CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_FEE_RATES_CACHE_TTL_MS = 5 * 60 * 1000;
