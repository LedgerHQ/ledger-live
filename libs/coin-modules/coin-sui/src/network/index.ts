import {
  getAccount,
  getOperations,
  getPreloadedData,
  paymentInfo,
  submitExtrinsic,
  createTransaction,
  executeTransactionBlock,
} from "./sdk";

export {
  getAccount,
  getOperations,
  getPreloadedData, // adjust with needs of preloaded data
  paymentInfo,
  submitExtrinsic,
};

export default {
  getAccount,
  getOperations,
  getPreloadedData, // adjust with needs of preloaded data
  // getFees,
  // submit,
  // disconnect, // if using persisting connection

  paymentInfo,
  submitExtrinsic,
  createTransaction,
  executeTransactionBlock,
};
