import * as sdk from "./sdk";

export {
  getAccountBalances,
  getAllBalancesCached,
  getOperations,
  getBlock,
  getBlockInfo,
  getDelegatedStakes,
  paymentInfo,
  createTransaction,
  executeTransactionBlock,
  getValidators,
} from "./sdk";

export default {
  getAccountBalances: sdk.getAccountBalances,
  getAllBalancesCached: sdk.getAllBalancesCached,
  getOperations: sdk.getOperations,
  getBlock: sdk.getBlock,
  getBlockInfo: sdk.getBlockInfo,
  getDelegatedStakes: sdk.getDelegatedStakes,
  paymentInfo: sdk.paymentInfo,
  createTransaction: sdk.createTransaction,
  executeTransactionBlock: sdk.executeTransactionBlock,
  getValidators: sdk.getValidators,
};
