// @flow

let impl = e => e;

export function setRemapLibcoreErrorsImplementation(remap: Error => Error) {
  impl = remap;
}

export function remapLibcoreErrors(error: Error): Error {
  return impl(error);
}
