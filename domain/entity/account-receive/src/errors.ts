/** The account has no address to receive on yet: its network has not assigned one. */
export class ReceiveAddressUnknownError extends Error {
  override name = "ReceiveAddressUnknownError";
}

/** The account has no device path to verify its receive address at. */
export class ReceivePathUnknownError extends Error {
  override name = "ReceivePathUnknownError";
}
