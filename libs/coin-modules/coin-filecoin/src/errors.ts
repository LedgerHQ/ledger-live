/*
 * When the recipient is non f0, f4 or eth address during token transfer
 */
export class InvalidRecipientForTokenTransfer extends Error {
  override name = "InvalidRecipientForTokenTransfer";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "InvalidRecipientForTokenTransfer");
    if (fields) Object.assign(this, fields);
  }
}

/*
 * When the fee estimation endpoint fails
 */
export class FilecoinFeeEstimationFailed extends Error {
  override name = "FilecoinFeeEstimationFailed";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "FilecoinFeeEstimationFailed");
    if (fields) Object.assign(this, fields);
  }
}
