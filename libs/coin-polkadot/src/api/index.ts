/*

// Alternative Implementations provided for example or future implementations

export { getOperations } from "./subscan";

export {
  isElectionClosed,
  isNewAccount,
  isControllerAddress,
  verifyValidatorAddresses,
  getAccount,
  getTransactionParams,
  submitExtrinsic,
  paymentInfo,
  getValidators,
  getStakingProgress,
  getRegistry,
  disconnect,
} from "./websocket";

*/
export { getOperations } from "./bisontrails";
export {
  isElectionClosed,
  isNewAccount,
  isControllerAddress,
  verifyValidatorAddresses,
  getAccount,
  getTransactionParams,
  getMinimumBondBalance,
  submitExtrinsic,
  paymentInfo,
  getValidators,
  getStakingProgress,
  getRegistry,
  disconnect,
} from "./sidecar";
