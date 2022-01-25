import { DisconnectedDevice } from "@ledgerhq/errors";
export const remapError = (error: Error | null | undefined) => {
  if (!error || !error.message) return error;

  if (
    error.message.includes("was disconnected") ||
    error.message.includes("not found")
  ) {
    return new DisconnectedDevice();
  }

  return error;
};
export const rethrowError = (e: Error | null | undefined) => {
  throw remapError(e);
};
export const decoratePromiseErrors = <A>(promise: Promise<A>): Promise<A> =>
  promise.catch(rethrowError);
