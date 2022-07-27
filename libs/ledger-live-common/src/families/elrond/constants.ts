import BigNumber from "bignumber.js";

export const HASH_TRANSACTION = {
  version: 2,
  options: 1,
};
export const METACHAIN_SHARD = 4294967295;
export const MAX_PAGINATION_SIZE = 10000;
export const GAS = {
  ESDT_TRANSFER: 500000,
  DELEGATE: 12000000,
  CLAIM: 6000000,
};
export const CHAIN_ID = "1";
export const MIN_DELEGATION_AMOUNT: BigNumber = new BigNumber(
  1000000000000000000
);
export const MIN_DELEGATION_AMOUNT_DENOMINATED: BigNumber = new BigNumber(1);
export const FEES_BALANCE: BigNumber = new BigNumber("5000000000000000"); // 0.005 EGLD for future transactions
export const DECIMALS_LIMIT = 18;
