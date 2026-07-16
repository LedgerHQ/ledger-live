/**
 * Thrown when a decoded swap payload field is larger than what the Exchange
 * device app can store. It lets us surface a precise reason (which field, its
 * limit and the actual size) instead of the device's generic
 * DESERIALIZATION_FAILED (0x6a81) status, which is opaque for investigations.
 */
export class SwapPayloadFieldExceedsLimit extends Error {
  override name = "SwapPayloadFieldExceedsLimit";
  readonly field: string;
  readonly limit: number;
  readonly actual: number;

  constructor(field: string, limit: number, actual: number) {
    super(`Swap payload field "${field}" exceeds device limit: ${actual} > ${limit} bytes`);
    this.field = field;
    this.limit = limit;
    this.actual = actual;
  }
}
