// @flow

let impl = e => e;

export function setRemapLibcoreErrorsImplementation(
  remap: (Error | string) => Error
) {
  impl = remap;
}

export function remapLibcoreErrors(error: Error | string): Error {
  return impl(error);
}

export function isNonExistingAccountError(error: Error): boolean {
  return error.message.includes("doesn't exist");
}

export function isNonExistingWalletError(error: Error): boolean {
  return error.message.includes("doesn't exist");
}
