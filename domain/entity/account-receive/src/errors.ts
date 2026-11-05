/** The account has no address to receive on yet: its network has not assigned one. */
export class ReceiveAddressUnknownError extends Error {
  override name = "ReceiveAddressUnknownError";
}
