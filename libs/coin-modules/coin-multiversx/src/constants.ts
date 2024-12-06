import BigNumber from "bignumber.js";

export const TRANSACTION_OPTIONS_TX_HASH_SIGN = 0b0001;
export const TRANSACTION_VERSION_DEFAULT = 2;
export const METACHAIN_SHARD = 4294967295;
export const MAX_PAGINATION_SIZE = 50;
export const GAS = {
  ESDT_TRANSFER: 500000,
  DELEGATE: 75000000,
  CLAIM: 6000000,
};
export const GAS_PRICE = 1000000000;
export const MIN_GAS_LIMIT = 50000;
export const GAS_PER_DATA_BYTE = 1500;
export const GAS_PRICE_MODIFIER = 0.01;
export const CHAIN_ID = "1";
export const MIN_DELEGATION_AMOUNT: BigNumber = new BigNumber("1000000000000000000");
export const DECIMALS_LIMIT = 18;

export const MULTIVERSX_EXPLORER_URL = "https://explorer.multiversx.com";
export const MULTIVERSX_STAKING_POOL =
  "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
export const MULTIVERSX_LEDGER_VALIDATOR_ADDRESS =
  "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqppllllls9ftvxy";
