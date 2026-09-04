export const MAINNET_NETWORK_IDENTIFIER = {
  network_identifier: {
    blockchain: "mina",
    network: "mainnet",
  },
};

export const MINA_VALID_UNTIL_DEFAULT = 4294967295;

export const MINA_MAINNET_NETWORK_ID = 1;
export const MINA_TOKEN_ID = "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf";
export const MINA_DECIMALS = 9;
export const MINA_SYMBOL = "MINA";
export const MINA_CURVE_TYPE = "pallas";

export const MINA_DECODED_ADDRESS_LENGTH = 72;

export const MAX_TRANSACTIONS_PER_PAGE = 100;
export const MINA_ROSETTA_TIMEOUT = 120000;
export const MINA_API_RETRY_COUNT = 3;

export const MINA_VALIDATORS_TIMEOUT = 30000;
export const MAX_VALIDATORS_PER_PAGE = 50;
// Bounds the pagination loop: an upstream no longer returning `last` must not spin forever.
export const MAX_VALIDATORS_PAGES = 20;
// The validator list is network-wide and only meaningfully changes once per epoch (~2 weeks),
// so one fetch is shared by every account instead of one per account per sync.
export const MINA_VALIDATORS_CACHE_TTL_MINUTES = 30;

// Block timestamps are resolved once per unique block to build the operation dates.
// Rosetta /search/transactions does not return per-tx timestamps, so we fetch /block;
// bound the concurrency (and use a shorter timeout) to avoid an unbounded burst that
// overwhelms the node when an account has many transactions.
export const MINA_BLOCK_INFO_CONCURRENCY = 8;
export const MINA_BLOCK_INFO_TIMEOUT = 30000;

export const MINA_CANCEL_RETURN_CODE = "27013";
