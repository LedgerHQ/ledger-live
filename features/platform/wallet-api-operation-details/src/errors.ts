/** No account of the user has the Wallet API account id. */
export class OperationDetailsAccountNotFound extends Error {
  override name = "OperationDetailsAccountNotFound";
}

/** The account has no confirmed or pending operation with the transaction hash. */
export class OperationDetailsOperationNotFound extends Error {
  override name = "OperationDetailsOperationNotFound";
}
