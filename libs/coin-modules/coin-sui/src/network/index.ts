import {
  getAccount,
  getOperations,
  getPreloadedData,
  paymentInfo,
  submitExtrinsic,
  getRegistry,
} from "./sdk";

export {
  getAccount,
  getOperations,
  getPreloadedData, // adjust with needs of preloaded data
  paymentInfo,
  submitExtrinsic,
  getRegistry,
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
  getRegistry,
};
