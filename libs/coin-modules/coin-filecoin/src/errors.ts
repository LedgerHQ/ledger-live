/*
 * When the recipient is non f0, f4 or eth address during token transfer
 */
export class InvalidRecipientForTokenTransfer extends Error {
  override name = "InvalidRecipientForTokenTransfer";
  constructor(message?: string) {
    super(message ?? "InvalidRecipientForTokenTransfer");
  }
}

/*
 * When the fee estimation endpoint fails
 */
export class FilecoinFeeEstimationFailed extends Error {
  override name = "FilecoinFeeEstimationFailed";
  constructor(message?: string) {
    super(message ?? "FilecoinFeeEstimationFailed");
  }
}
