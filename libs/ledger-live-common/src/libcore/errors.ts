let impl = (e: unknown): Error =>
  e && e instanceof Error ? e : new Error(String(e));

export function setRemapLibcoreErrorsImplementation(
  remap: (error: unknown) => Error
): void {
  impl = remap;
}
export function remapLibcoreErrors(error: unknown): Error {
  return impl(error);
}
export function isNonExistingAccountError(error: Error): boolean {
  return error.message.includes("doesn't exist");
}
export function isNonExistingWalletError(error: Error): boolean {
  return error.message.includes("doesn't exist");
}
export function isAlreadyExistingWalletError(error: Error): boolean {
  return error.message.includes("already exists");
}
