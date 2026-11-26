import { toKeyRingError } from "../../errors";

/**
 * Runs a v1 protocol call and rethrows its key ring failures as `KeyRingError`s; anything else,
 * such as a device disconnection, passes through unchanged.
 */
export async function withKeyRingErrors<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toKeyRingError(error) ?? error;
  }
}
