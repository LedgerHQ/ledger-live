export const TEST_ADDRESSES = {
  SECP256K1: "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581",
  RECIPIENT_SECP256K1: "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB",
  RECIPIENT_ED25519: "01e28f293af356e7a15068e535c248ec07c887b2ab7a5d9557037a0e998e5d97bf",
  INVALID: "notavalidaddress",
};

export const FUNDED_MAINNET_PUBLIC_KEY =
  "0202ba6dc98cbe677711a45bf028a03646f9e588996eb223fad2485e8bc391b01581";

/** Mainnet account whose deploy history spans several indexer pages. */
export const BUSY_MAINNET_PUBLIC_KEY =
  "020378080845446b50d7bfe2c450b5b24b8c586efaf1aa051feff4d12ad8f1ebf9e6";

/** Freshly generated ed25519 key, so it is a valid curve point the node accepts but never funded. */
export const UNFUNDED_MAINNET_PUBLIC_KEY =
  "01e48fa53bbd86a05944a69c3a1db5493ac909836dad7fdb46d9aa2ccebcc4e9cd";

export const TEST_TRANSACTION_HASHES = {
  VALID: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  PENDING: "pending0123456789abcdef0123456789abcdef0123456789abcdef01234567",
  FAILED: "failed00123456789abcdef0123456789abcdef0123456789abcdef01234567",
};

export const TEST_TRANSFER_IDS = {
  VALID: "123456",
  NUMERIC: "654321",
  INVALID: "not-a-valid-id",
};
